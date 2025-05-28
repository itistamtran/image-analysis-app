from flask import Flask, request, jsonify
from flask_cors import CORS
from model import predict_image

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        print("Request received")
        print(request.files)  
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        file = request.files['image']
        print("Image file received:", file.filename)
        result, confidence, all_probs = predict_image(file.read())
        return jsonify({
            'prediction': result,
            'confidence': confidence,
            'probabilities': all_probs
        })

   
    except Exception as e:
        print(f"Error in /predict: {e}")
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

