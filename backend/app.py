from flask import Flask, request, jsonify
from flask_cors import CORS
from model import predict_image
import os

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        file = request.files['image']
        result, confidence, all_probs = predict_image(file.read())

        return jsonify({
            'prediction': result,
            'confidence': confidence,
            'probabilities': all_probs
        })

    except Exception as e:
        app.logger.error(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    app.run(host='0.0.0.0', port=port)
