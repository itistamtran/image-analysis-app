from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Test route
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Flask is working!"}), 200

# Test doctor route (hardcoded)
@app.route("/doctors/<doctor_id>", methods=["GET"])
def test_doctor(doctor_id):
    return jsonify({
        "message": f"Doctor endpoint working!",
        "doctor_id": doctor_id
    }), 200

if __name__ == "__main__":
    print("=" * 60)
    print("Starting TEST Flask Server on http://127.0.0.1:5001")
    print("=" * 60)
    print("\nRegistered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint:30s} {str(rule.methods):30s} {rule}")
    print("=" * 60)
    app.run(debug=True, host="0.0.0.0", port=5001)