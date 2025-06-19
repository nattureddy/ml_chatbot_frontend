import React, { useState } from "react";
import axios from "axios";

const MLDashboard = () => {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [modelName, setModelName] = useState("");
  const [response, setResponse] = useState(null);
  const [trainAllResult, setTrainAllResult] = useState(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [predictFile, setPredictFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictMode, setPredictMode] = useState("file");
  const [inputFeatures, setInputFeatures] = useState([]);
  const [inputValues, setInputValues] = useState({});

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload", formData);
      setResponse(res.data);
    } catch (err) {
      setResponse({ error: err.message });
    }
  };

  const handleTrain = async () => {
    if (!file || !targetColumn || !modelName) {
      alert("Please fill all fields");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", targetColumn);
    formData.append("model_name", modelName);

    try {
      const res = await axios.post("http://127.0.0.1:8000/train", formData);
      setResponse(res.data);
      setSelectedModel(res.data.model);
    } catch (err) {
      setResponse({ error: err.message });
    }
  };

  const handleTrainAll = async () => {
    if (!file || !targetColumn) {
      alert("Please select file and target column");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", targetColumn);

    try {
      const res = await axios.post("http://127.0.0.1:8000/train_all", formData);
      setTrainAllResult(res.data);
      setSelectedModel(res.data.best_model);
    } catch (err) {
      setTrainAllResult({ error: err.message });
    }
  };

  const fetchInputFeatures = async () => {
    if (!selectedModel) return alert("Please enter model name first");
    try {
      const res = await axios.get("http://127.0.0.1:8000/get_input_features", {
        params: { model_name: selectedModel },
      });
      setInputFeatures(res.data.features);
      setInputValues({});
      setPrediction(null);
    } catch (err) {
      alert("Error fetching features: " + err.message);
    }
  };

const handlePredict = async (e) => {
  e.preventDefault();
  if (!selectedModel) {
    alert("Please provide a trained model name.");
    return;
  }

  if (predictMode === "file") {
    if (!predictFile) {
      alert("Please select a file for prediction.");
      return;
    }

    const formData = new FormData();
    formData.append("file", predictFile);
    formData.append("model_name", selectedModel);

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", formData);
      setPrediction(res.data);
    } catch (error) {
      alert("Prediction failed: " + error.message);
    }
  } else {
    // ✅ Convert inputValues to CSV and send it to /predict
    try {
      const headers = Object.keys(inputValues).join(",");
      const values = Object.values(inputValues).join(",");
      const csvContent = `${headers}\n${values}`;
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], "manual_input.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("model_name", selectedModel);

      const res = await axios.post("http://127.0.0.1:8000/predict", formData);
      setPrediction(res.data);
    } catch (error) {
      alert("Manual prediction failed: " + error.message);
    }
  }
};


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🧠 ML Dashboard</h1>

      {/* Upload */}
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      {response?.preview && <pre>{JSON.stringify(response.preview, null, 2)}</pre>}

      {/* Training */}
      <input value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)} placeholder="Target Column" />
      <select value={modelName} onChange={(e) => setModelName(e.target.value)}>
        <option value="">Select Model</option>
        <option>Logistic Regression</option>
        <option>Random Forest</option>
        <option>Decision Tree</option>
        <option>KNN</option>
        <option>Linear Regression</option>
      </select>
      <button onClick={handleTrain}>Train</button>
      <button onClick={handleTrainAll}>Train All</button>

      {trainAllResult?.best_model && <pre>{JSON.stringify(trainAllResult, null, 2)}</pre>}

      {/* Prediction */}
      <h2>Prediction</h2>
      <label>
        <input type="radio" checked={predictMode === "file"} onChange={() => setPredictMode("file")} /> File
      </label>
      <label>
        <input type="radio" checked={predictMode === "manual"} onChange={() => setPredictMode("manual")} /> Manual
      </label>

      <input
        type="text"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        placeholder="Model Name"
      />

      {predictMode === "file" && <input type="file" onChange={(e) => setPredictFile(e.target.files[0])} />}

      {predictMode === "manual" && (
        <>
          <button onClick={fetchInputFeatures}>Get Features</button>
          {inputFeatures.map((f, i) => (
            <input
              key={i}
              placeholder={f}
              value={inputValues[f] || ""}
              onChange={(e) => setInputValues({ ...inputValues, [f]: e.target.value })}
            />
          ))}
        </>
      )}

      <button onClick={handlePredict}>Predict</button>

      {prediction?.prediction && (
        <div className="mt-2">
          <strong>Prediction:</strong> {JSON.stringify(prediction.prediction)}
        </div>
      )}

      {Array.isArray(prediction?.predictions) && (
        <ul>
          {prediction.predictions.map((p, i) => (
            <li key={i}>Row {i + 1}: {p}</li>
          ))}
        </ul>
      )}

      {prediction?.error && <div className="text-red-500">Error: {prediction.error}</div>}
    </div>
  );
};

export default MLDashboard;
