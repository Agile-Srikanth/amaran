const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pythonBridge = require('../services/python_bridge');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateAudioFile, validateJobId } = require('../middleware/validation');
const logger = require('../utils/logger');
const constants = require('../config/constants');

const router = express.Router();

const UPLOAD_DIR = constants.DIRECTORIES.UPLOADS;
const OUTPUT_DIR = constants.DIRECTORIES.OUTPUT;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-z0-9.-]/gi, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(sanitizedName));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (constants.SUPPORTED_AUDIO_FORMATS.ext.includes(ext) ||
    constants.SUPPORTED_AUDIO_FORMATS.mime.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported. Allowed formats: ${constants.SUPPORTED_AUDIO_FORMATS.ext.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: constants.MAX_FILE_SIZE
  }
});

// Job storage (in production, use a database)
const jobStatus = new Map();

/**
 * POST /api/process-audio
 * Process audio file and generate visualizations + emotion detection
 */
router.post('/process-audio',
  upload.single('audio'),
  validateAudioFile,
  asyncHandler(async (req, res) => {
    const jobId = uuidv4();
    const inputPath = req.file.path;
    const jobOutputDir = path.join(OUTPUT_DIR, jobId);
    const startTime = Date.now();

    try {
      // Create job output directory
      if (!fs.existsSync(jobOutputDir)) {
        fs.mkdirSync(jobOutputDir, { recursive: true });
      }

      // Initialize job status
      jobStatus.set(jobId, {
        status: constants.JOB_STATUS.PROCESSING,
        createdAt: new Date().toISOString(),
        progress: 0
      });

      logger.info('AUDIO_PROCESS', 'Started processing audio', {
        jobId: jobId,
        filename: req.file.originalname,
        size: req.file.size,
        path: inputPath
      });

      // Process audio file (generate waveforms, spectrograms)
      logger.info('AUDIO_PROCESS', 'Running audio processor', { jobId: jobId });

      let audioProcessResult;
      try {
        audioProcessResult = await pythonBridge.processAudio(inputPath, jobOutputDir);
      } catch (err) {
        logger.error('AUDIO_PROCESS', 'Audio processing failed', {
          jobId: jobId,
          error: err.message
        });

        updateJobStatus(jobId, {
          status: constants.JOB_STATUS.FAILED,
          error: 'Audio processing failed',
          errorMessage: err.message
        });

        cleanupJob(inputPath, jobOutputDir);

        return res.status(500).json({
          success: false,
          message: `Audio processing failed: ${err.message}`,
          jobId: jobId,
          error: err.message
        });
      }

      // Update job status
      updateJobStatus(jobId, {
        status: constants.JOB_STATUS.PROCESSING,
        progress: 50
      });

      // Run emotion detection
      logger.info('EMOTION_DETECT', 'Running emotion detection', { jobId: jobId });

      let emotionResult;
      try {
        emotionResult = await pythonBridge.detectEmotion(inputPath);
      } catch (err) {
        logger.error('EMOTION_DETECT', 'Emotion detection failed', {
          jobId: jobId,
          error: err.message
        });

        updateJobStatus(jobId, {
          status: constants.JOB_STATUS.FAILED,
          error: 'Emotion detection failed',
          errorMessage: err.message
        });

        cleanupJob(inputPath, jobOutputDir);

        return res.status(500).json({
          success: false,
          message: `Emotion detection failed: ${err.message}`,
          jobId: jobId,
          error: err.message
        });
      }

      const processingTime = Date.now() - startTime;

      // Prepare response
      // Use relative URLs - frontend's prefixUrl() will add the API base URL
      // Use snake_case field names to match frontend ProcessingResult interface
      const response = {
        success: true,
        job_id: jobId,
        original_audio_url: `/uploads/${path.basename(inputPath)}`,
        processed_audio_url: audioProcessResult.processed_audio_path ?
          `/output/${jobId}/${path.basename(audioProcessResult.processed_audio_path)}` : null,
        waveform_original_url: audioProcessResult.waveform_original_path ?
          `/output/${jobId}/${path.basename(audioProcessResult.waveform_original_path)}` : null,
        waveform_processed_url: audioProcessResult.waveform_processed_path ?
          `/output/${jobId}/${path.basename(audioProcessResult.waveform_processed_path)}` : null,
        spectrogram_original_url: audioProcessResult.spectrogram_original_path ?
          `/output/${jobId}/${path.basename(audioProcessResult.spectrogram_original_path)}` : null,
        spectrogram_processed_url: audioProcessResult.spectrogram_processed_path ?
          `/output/${jobId}/${path.basename(audioProcessResult.spectrogram_processed_path)}` : null,
        emotion: emotionResult.emotion || 'unknown',
        confidence: emotionResult.confidence || 0,
        all_emotions: emotionResult.all_emotions || {},
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      };

      // Update job status to completed
      updateJobStatus(jobId, {
        status: constants.JOB_STATUS.COMPLETED,
        result: response,
        completedAt: new Date().toISOString(),
        progress: 100
      });

      logger.info('AUDIO_PROCESS', 'Processing completed', {
        jobId: jobId,
        processingTime: `${processingTime}ms`,
        emotion: response.emotion,
        confidence: response.confidence,
        job_id: response.job_id
      });

      res.status(200).json(response);

    } catch (err) {
      logger.error('AUDIO_PROCESS', 'Unexpected error', {
        jobId: jobId,
        error: err.message
      });

      updateJobStatus(jobId, {
        status: constants.JOB_STATUS.FAILED,
        error: 'Unexpected error during processing'
      });

      cleanupJob(inputPath, jobOutputDir);

      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred during processing',
        jobId: jobId,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  })
);

/**
 * GET /api/status/:jobId
 * Check the status of a processing job
 */
router.get('/status/:jobId',
  validateJobId,
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    if (!jobStatus.has(jobId)) {
      logger.warn('JOB_STATUS', 'Job not found', { jobId: jobId });
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        jobId: jobId,
        timestamp: new Date().toISOString()
      });
    }

    const status = jobStatus.get(jobId);

    logger.info('JOB_STATUS', 'Retrieved job status', {
      jobId: jobId,
      status: status.status
    });

    res.status(200).json({
      success: true,
      jobId: jobId,
      ...status,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'audio-api',
    status: 'operational',
    activeJobs: jobStatus.size,
    timestamp: new Date().toISOString()
  });
});

/**
 * Helper function to update job status
 */
function updateJobStatus(jobId, updates) {
  if (jobStatus.has(jobId)) {
    const current = jobStatus.get(jobId);
    jobStatus.set(jobId, {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

/**
 * Helper function to cleanup job files
 */
function cleanupJob(uploadPath, outputDir) {
  try {
    if (uploadPath && fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
      logger.info('CLEANUP', 'Deleted upload file', { path: uploadPath });
    }

    if (outputDir && fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
      logger.info('CLEANUP', 'Deleted output directory', { path: outputDir });
    }
  } catch (err) {
    logger.error('CLEANUP', 'Cleanup failed', { error: err.message });
  }
}

module.exports = router;
