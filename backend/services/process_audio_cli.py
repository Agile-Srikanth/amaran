#!/usr/bin/env python3
"""
CLI wrapper for audio processing
Processes audio file and generates visualizations
Usage: python process_audio_cli.py <input_path> <output_dir>
"""

import sys
import json
import os
import logging
import warnings
from pathlib import Path

# Suppress all warnings and logs so only our JSON goes to stdout
warnings.filterwarnings('ignore')
logging.disable(logging.CRITICAL)

# Force matplotlib to use non-interactive backend BEFORE any imports
import matplotlib
matplotlib.use('Agg')

# Add the directory containing this script to the path
# so we can import audio_processor.py from the same folder
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from audio_processor import AudioProcessor
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Failed to import AudioProcessor: {str(e)}. Make sure you have installed: pip install librosa scipy soundfile matplotlib numpy"
    }))
    sys.exit(0)  # Exit 0 so python_bridge can parse our JSON error


def main():
    """Main CLI entry point"""
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: process_audio_cli.py <input_path> <output_dir>"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]

    # Validate inputs
    if not os.path.exists(input_path):
        # Also try resolving from the script's own directory
        alt_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', input_path)
        if os.path.exists(alt_path):
            input_path = alt_path
        else:
            print(json.dumps({
                "success": False,
                "error": f"Input file not found: {input_path} (cwd={os.getcwd()})"
            }))
            sys.exit(0)

    # Create output directory if needed
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Initialize processor
        processor = AudioProcessor()

        # Process audio file (correct method name is process_file)
        result = processor.process_file(input_path, output_dir)

        if result.get('status') == 'error':
            print(json.dumps({
                "success": False,
                "error": result.get('error', 'Audio processing failed')
            }))
            sys.exit(0)

        # Map output_files keys to the expected response format
        output_files = result.get('output_files', {})

        response = {
            "success": True,
            "processed_audio_path": output_files.get('cleaned_audio'),
            "waveform_original_path": output_files.get('waveform_original'),
            "waveform_processed_path": output_files.get('waveform_cleaned'),
            "spectrogram_original_path": output_files.get('spectrogram_original'),
            "spectrogram_processed_path": output_files.get('spectrogram_cleaned')
        }

        print(json.dumps(response))
        sys.exit(0)

    except Exception as e:
        import traceback
        error_response = {
            "success": False,
            "error": f"{str(e)} | {traceback.format_exc()}"
        }
        print(json.dumps(error_response))
        sys.exit(0)


if __name__ == '__main__':
    main()
