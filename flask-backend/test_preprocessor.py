# test_preprocessor.py
import joblib
import pandas as pd

# Create test DataFrame matching analyze_claim.py
df = pd.DataFrame({
    "combinedText": ["test test"],
    "incidentType": ["accident"],
    "profession": ["Ingénieur"],
    "policyType": ["automobile"],
    "thirdPartyInvolved": [1],
    "supportingFilesCount": [2],
    "daysSinceIncident": [12],
    "isCompatible": [True],
    "isDuplicate": [False]
})

preprocessor = joblib.load('C:/Users/wiki/Desktop/App_assurance/ai/preprocessor.pkl')
X = preprocessor.transform(df)
print(f"Input columns: {len(df.columns)}")
print(f"Output features: {X.shape[1]}")
print(f"Column names: {df.columns.tolist()}")