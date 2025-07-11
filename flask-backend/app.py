from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import logging
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load the saved model and preprocessor
model_path = "claims_model_clf.pkl"
preprocessor_path = "preprocessor.pkl"
try:
    clf_pipeline = joblib.load(model_path)
    preprocessor = joblib.load(preprocessor_path)
    logger.info("Model and preprocessor loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model or preprocessor: {e}")
    raise

# Define expected features
expected_features = [
    "combinedText", "incidentType", "profession", "policyType",
    "thirdPartyInvolved", "supportingFilesCount", "daysSinceIncident",
    "isCompatible", "isDuplicate", "birthDate_year"
]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        logger.debug(f"Received data: {data}")

        if not data or 'claim' not in data:
            return jsonify({"error": "No claim data provided"}), 400

        claim = data['claim']
        input_df = pd.DataFrame([claim])

        missing_features = [f for f in expected_features if f not in input_df.columns]
        if missing_features:
            logger.warning(f"Missing features: {missing_features}")

        for feature in expected_features:
            if feature not in input_df.columns:
                if feature in ["thirdPartyInvolved", "isCompatible", "isDuplicate"]:
                    input_df[feature] = 0
                elif feature == "combinedText":
                    input_df[feature] = "aucune description"
                elif feature == "daysSinceIncident":
                    input_df[feature] = int(claim.get('daysSinceIncident', 0))  # Convert to int
                elif feature == "supportingFilesCount":
                    input_df[feature] = len(claim.get('supportingFiles', []))
                elif feature == "birthDate_year":
                    input_df[feature] = claim.get('birthDate_year', 1980)
                else:
                    input_df[feature] = "Other"

        input_df = input_df[expected_features]
        logger.debug(f"Transformed input_df: {input_df.to_dict()}")

        input_transformed = preprocessor.transform(input_df)
        prediction = clf_pipeline.predict(input_transformed)
        probability = clf_pipeline.predict_proba(input_transformed)[0]

        # Use the string prediction directly
        pred_label = prediction[0]  # Already 'suspicieux' or 'valide'

        response = {
            "prediction": pred_label,  # Return the string label
            "probability_suspicieux": float(probability[0]),
            "probability_valide": float(probability[1]),
            "status": "success"
        }

        logger.info(f"Prediction: {response}")
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error in predict: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)