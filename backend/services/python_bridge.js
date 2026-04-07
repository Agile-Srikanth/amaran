const { spawn, execSync } = require('child_process');
const path = require('path');

// On Windows, Python is usually 'python' not 'python3'
function detectPython() {
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;

  // Try python3 first, then python
  for (const cmd of ['python3', 'python']) {
    try {
      const version = execSync(`${cmd} --version 2>&1`, { encoding: 'utf8', timeout: 5000 });
      if (version.includes('Python 3')) {
        console.log(`[PYTHON_BRIDGE] Detected Python: ${cmd} (${version.trim()})`);
        return cmd;
      }
    } catch (e) {
      // This command not available, try next
    }
  }
  console.error('[PYTHON_BRIDGE] WARNING: Could not detect Python 3. Defaulting to "python"');
  return 'python';
}

const PYTHON_PATH = detectPython();
const TIMEOUT = 180000; // 180 seconds (3 min for slow free-tier servers)

/**
 * Execute a Python script and return parsed JSON output
 * @param {string} scriptPath - Path to Python script
 * @param {string[]} args - Command line arguments
 * @param {number} timeout - Execution timeout in ms
 * @returns {Promise<object>} Parsed JSON output from Python script
 */
function executePythonScript(scriptPath, args = [], timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    // Use the backend root as CWD so relative paths (uploads/, output/) resolve correctly
    const backendRoot = path.join(__dirname, '..');

    console.log(`[PYTHON_BRIDGE] Executing: ${PYTHON_PATH} ${scriptPath} ${args.join(' ')}`);
    console.log(`[PYTHON_BRIDGE] CWD: ${backendRoot}`);

    const child = spawn(PYTHON_PATH, [scriptPath, ...args], {
      cwd: backendRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Capture stdout
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Capture stderr
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[PYTHON_STDERR]`, data.toString().trim());
    });

    // Handle spawn errors (e.g., python not found)
    child.on('error', (err) => {
      console.error(`[PYTHON_ERROR] Failed to start process:`, err);
      reject(new Error(`Failed to execute Python script: ${err.message}`));
    });

    // Handle process exit
    child.on('close', (code) => {
      clearTimeout(timeoutId);

      // Try to parse stdout as JSON regardless of exit code
      // (our Python scripts print JSON errors to stdout before exiting with code 1)
      if (stdout.trim()) {
        try {
          const result = JSON.parse(stdout.trim());

          // If JSON parsed successfully, check the success field
          if (code === 0 || result.success) {
            console.log(`[PYTHON_BRIDGE] Script executed successfully`);
            resolve(result);
            return;
          }

          // Script returned JSON error
          const errorMsg = result.error || `Python script failed with exit code ${code}`;
          console.error(`[PYTHON_BRIDGE] Script error:`, errorMsg);
          reject(new Error(errorMsg));
          return;
        } catch (parseErr) {
          // stdout is not valid JSON
          console.error(`[PYTHON_BRIDGE] Failed to parse output:`, stdout.substring(0, 500));
        }
      }

      // No parseable JSON output - report stderr or exit code
      if (code !== 0) {
        const errorDetail = stderr.trim() || stdout.trim() || '(no error output captured)';
        console.error(`[PYTHON] Process exited with code ${code}`);
        console.error(`[PYTHON] stderr: ${stderr.trim()}`);
        console.error(`[PYTHON] stdout: ${stdout.substring(0, 500)}`);
        reject(new Error(`Python script failed with exit code ${code}: ${errorDetail}`));
      } else {
        reject(new Error('Python script produced no output'));
      }
    });

    // Timeout handling
    const timeoutId = setTimeout(() => {
      console.error(`[PYTHON_BRIDGE] Script execution timeout after ${timeout}ms`);
      child.kill();
      reject(new Error(`Python script execution timeout after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Process audio file and generate visualizations
 * @param {string} inputPath - Path to input audio file
 * @param {string} outputDir - Directory to save processed files
 * @returns {Promise<object>} Processing result with file paths
 */
async function processAudio(inputPath, outputDir) {
  try {
    const scriptPath = path.join(__dirname, '..', 'services', 'process_audio_cli.py');

    console.log(`[processAudio] Input: ${inputPath}, Output: ${outputDir}`);

    const result = await executePythonScript(scriptPath, [inputPath, outputDir], 180000);

    if (!result.success) {
      throw new Error(result.error || 'Audio processing failed');
    }

    console.log(`[processAudio] Success: Generated visualizations`);

    return {
      success: true,
      processed_audio_path: result.processed_audio_path,
      waveform_original_path: result.waveform_original_path,
      waveform_processed_path: result.waveform_processed_path,
      spectrogram_original_path: result.spectrogram_original_path,
      spectrogram_processed_path: result.spectrogram_processed_path
    };
  } catch (err) {
    console.error(`[processAudio] Error:`, err.message);
    if (err.message.includes('No module named')) {
      throw new Error(`Missing Python package. Run: pip install librosa scipy soundfile matplotlib numpy`);
    }
    throw err;
  }
}

/**
 * Detect emotion from audio file
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<object>} Emotion detection result
 */
async function detectEmotion(audioPath) {
  try {
    const scriptPath = path.join(__dirname, '..', 'services', 'emotion_detection_cli.py');

    console.log(`[detectEmotion] Processing: ${audioPath}`);

    const result = await executePythonScript(scriptPath, [audioPath], 180000);

    if (!result.success) {
      throw new Error(result.error || 'Emotion detection failed');
    }

    console.log(`[detectEmotion] Success: Detected emotion - ${result.emotion} (confidence: ${result.confidence})`);

    return {
      success: true,
      emotion: result.emotion,
      confidence: result.confidence,
      all_emotions: result.all_emotions || {}
    };
  } catch (err) {
    console.error(`[detectEmotion] Error:`, err.message);
    if (err.message.includes('No module named')) {
      throw new Error(`Missing Python package. Run: pip install librosa scipy soundfile matplotlib numpy`);
    }
    throw err;
  }
}

/**
 * Get Python version and verify installation
 * @returns {Promise<string>} Python version
 */
async function getPythonVersion() {
  try {
    const scriptPath = path.join(__dirname, '..', 'services', 'get_version.py');
    const result = await executePythonScript(scriptPath, [], 5000);

    console.log(`[pythonBridge] Python version: ${result.version}`);
    return result.version;
  } catch (err) {
    console.error(`[pythonBridge] Failed to get Python version:`, err);
    throw err;
  }
}

module.exports = {
  executePythonScript,
  processAudio,
  detectEmotion,
  getPythonVersion
};
