import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUploadCloud,
  FiCpu,
  FiBarChart2,
  FiActivity,
  FiArrowRightCircle,
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

// Global Toast/Modal Component
const Toast = ({ message, type, onClose }) => {
  const bgColor = {
    error: "bg-red-500",
    success: "bg-green-500",
    info: "bg-blue-500",
  }[type];

  const Icon = {
    error: FiXCircle,
    success: FiCheckCircle,
    info: FiInfo,
  }[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className={`fixed top-5 right-5 z-50 ${bgColor} text-white p-4 rounded-lg shadow-xl flex items-center space-x-3 cursor-pointer`}
      onClick={onClose}
    >
      {Icon && <Icon className="text-2xl" />}
      <span className="font-semibold">{message}</span>
    </motion.div>
  );
};

const ThemedMLDashboard = () => {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [modelName, setModelName] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [response, setResponse] = useState(null);
  const [trainResult, setTrainResult] = useState(null);
  const [trainAllResult, setTrainAllResult] = useState(null);
  const [predictFile, setPredictFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictMode, setPredictMode] = useState("file");
  const [inputFeatures, setInputFeatures] = useState([]);
  const [inputValues, setInputValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const colors = {
    primaryGradient: "bg-gradient-to-br from-purple-600 to-indigo-700",
    secondaryGradient: "bg-gradient-to-br from-blue-600 to-cyan-600",
    accentGradient: "bg-gradient-to-br from-green-500 to-emerald-600",
    textPrimary: "text-purple-800",
    textSecondary: "text-gray-600",
    inputBorder: "border-gray-300 focus:border-purple-500 focus:ring-purple-200",
    hoverScale: "hover:scale-102",
    activeScale: "active:scale-98",
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0 8px 25px rgba(0,0,0,0.2)" },
    tap: { scale: 0.95 },
    rest: { scale: 1, boxShadow: "0 4px 15px rgba(0,0,0,0.1)" },
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      showToast("CSV file selected!", "info");
    } else {
      setFile(null);
      showToast("Please upload a valid CSV file.", "error");
    }
  };

  const handlePredictFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setPredictFile(selectedFile);
      showToast("Prediction CSV file selected!", "info");
    } else {
      setPredictFile(null);
      showToast("Please upload a valid CSV file for prediction.", "error");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a file to upload.", "error");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("https://mm-ml-modelling.onrender.com/upload", formData);
      setResponse(res.data);
      showToast("File uploaded successfully!", "success");
    } catch (err) {
      showToast("Failed to upload file: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    if (!file || !targetColumn || !modelName) {
      showToast("Please select a file, target column, and model to train.", "error");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", targetColumn);
    formData.append("model_name", modelName);

    try {
      const res = await axios.post("https://mm-ml-modelling.onrender.com/train", formData);
      setTrainResult(res.data);
      setSelectedModel(res.data.model);
      showToast(`${res.data.model} trained successfully!`, "success");
    } catch (err) {
      showToast("Training failed: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTrainAll = async () => {
    if (!file || !targetColumn) {
      showToast("Please select a file and target column to train all models.", "error");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_column", targetColumn);
    try {
      const res = await axios.post("https://mm-ml-modelling.onrender.com/train_all", formData);
      setTrainAllResult(res.data);
      setSelectedModel(res.data.best_model);
      showToast(`Best model (${res.data.best_model}) found and trained!`, "success");
    } catch (err) {
      showToast("Training all models failed: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchInputFeatures = async () => {
    if (!selectedModel) {
      showToast("Please select a model first to get its required features.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("https://mm-ml-modelling.onrender.com/get_input_features", {
        params: { model_name: selectedModel },
      });
      setInputFeatures(res.data.features || []);
      setInputValues({});
      setPrediction(null);
      showToast("Input features fetched!", "info");
    } catch (err) {
      showToast("Failed to fetch input features: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!selectedModel) {
      showToast("Please select a model to predict.", "error");
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("model_name", selectedModel);

      if (predictMode === "file") {
        if (!predictFile) {
          showToast("Upload CSV file for prediction.", "error");
          setLoading(false);
          return;
        }
        formData.append("file", predictFile);
      } else { // predictMode === "manual"
        if (inputFeatures.length === 0) {
            showToast("Please fetch features first and fill values for manual prediction.", "error");
            setLoading(false);
            return;
        }
        // Check if all input values are provided
        const allFeaturesFilled = inputFeatures.every(feature => inputValues[feature] !== undefined && inputValues[feature] !== null && inputValues[feature] !== "");
        if (!allFeaturesFilled) {
            showToast("Please fill all feature values for manual prediction.", "error");
            setLoading(false);
            return;
        }

        // Create CSV content from inputValues
        const header = inputFeatures.join(',');
        const dataRow = inputFeatures.map(feature => {
            // Ensure values are properly quoted if they contain commas or special characters
            const value = inputValues[feature];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
        const csvContent = `${header}\n${dataRow}`;

        // Create a Blob and then a File from the CSV content
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvFile = new File([csvBlob], 'manual_prediction_input.csv', { type: 'text/csv' });

        formData.append("file", csvFile);
      }
      
      // Use the /predict endpoint for both file and manual predictions
      const res = await axios.post("https://mm-ml-modelling.onrender.com/predict", formData);
      setPrediction(res.data);
      showToast("Prediction successful!", "success");

    } catch (err) {
      showToast("Prediction failed: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-10 px-4 font-sans relative overflow-hidden">
      {/* Background Animated Circles (for extra attraction) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          initial={{ y: "-100%", x: "-100%", rotate: 0 }}
          animate={{ y: "200%", x: "200%", rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-64 h-64 bg-purple-300 opacity-20 rounded-full blur-3xl -top-32 -left-32"
        ></motion.div>
        <motion.div
          initial={{ y: "100%", x: "100%", rotate: 0 }}
          animate={{ y: "-200%", x: "-200%", rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute w-80 h-80 bg-indigo-300 opacity-15 rounded-full blur-3xl -bottom-40 -right-40"
        ></motion.div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <motion.div
        className="relative z-10 max-w-5xl mx-auto bg-white p-8 rounded-3xl shadow-2xl ring-4 ring-purple-200 backdrop-blur-sm bg-opacity-90"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className={`${colors.textPrimary} text-center text-5xl font-extrabold mb-10 flex items-center justify-center gap-3 drop-shadow-md`}>
          <FaRobot className="text-purple-500 text-6xl animate-pulse" /> ML Magic Studio
        </h1>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-t-4 border-b-4 border-purple-500 rounded-full"
            ></motion.div>
            <span className="ml-4 text-white text-xl font-semibold">Processing...</span>
          </motion.div>
        )}

        {/* Upload Section */}
        <motion.section
          className="mb-10 p-6 rounded-2xl shadow-lg border border-purple-200 transition-all duration-300 ease-in-out hover:shadow-xl"
          style={{ backgroundImage: "linear-gradient(to right bottom, #f3e8ff, #ede9fe)" }}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className={`${colors.textPrimary} text-3xl font-bold mb-4 flex items-center gap-2`}>
            <FiUploadCloud className="text-purple-500 text-4xl" /> 1. Upload Your Dataset
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="block w-full sm:w-auto cursor-pointer bg-white border border-dashed border-purple-400 rounded-lg p-4 text-center text-purple-600 hover:border-purple-600 transition duration-300 ease-in-out shadow-inner flex-grow">
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".csv" />
              <span className="font-semibold text-lg">
                {file ? file.name : "Click to select a CSV file"}
              </span>
              <p className="text-sm text-gray-500 mt-1">Max 50MB, CSV only</p>
            </label>
            <motion.button
              onClick={handleUpload}
              className={`${colors.primaryGradient} text-white px-8 py-3 rounded-xl font-semibold shadow-md flex items-center gap-2 ${colors.hoverScale} ${colors.activeScale} transition duration-300 ease-in-out`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <FiArrowRightCircle className="text-xl" /> Upload
            </motion.button>
          </div>
          <AnimatePresence>
            {response?.preview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-purple-100 mt-6 p-5 rounded-2xl shadow-inner text-sm text-purple-800 border border-purple-300 overflow-hidden"
              >
                <motion.strong
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-purple-700 flex items-center gap-2 mb-3 text-lg"
                >
                  <FiInfo /> File Details:
                </motion.strong>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <p><strong>Filename:</strong> <span className="font-medium text-purple-900">{response.filename}</span></p>
                    <p><strong>Total Rows:</strong> <span className="font-medium text-purple-900">{response.rows}</span></p>
                    <p><strong>Columns:</strong> <span className="font-medium text-purple-900">{response.columns?.join(", ")}</span></p>
                </div>
                <motion.strong
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-purple-700 flex items-center gap-2 mt-3 mb-2 text-lg"
                >
                  <FiBarChart2 /> Data Preview (First 5 Rows):
                </motion.strong>
                <motion.pre
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="whitespace-pre-wrap bg-white p-3 rounded-lg border border-purple-200 overflow-x-auto text-xs font-mono shadow-sm"
                >
                  {JSON.stringify(response.preview, null, 2)}
                </motion.pre>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Train Model Section */}
        <motion.section
          className="mb-10 p-6 rounded-2xl shadow-lg border border-blue-200 transition-all duration-300 ease-in-out hover:shadow-xl"
          style={{ backgroundImage: "linear-gradient(to right bottom, #e0f2fe, #bfdbfe)" }}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-blue-800 text-3xl font-bold mb-4 flex items-center gap-2">
            <FiCpu className="text-blue-500 text-4xl" /> 2. Train Your ML Model
          </h2>
          <div className="flex flex-wrap gap-4 mb-5">
            <input
              type="text"
              placeholder="Enter Target Column Name"
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              className={`border ${colors.inputBorder} px-4 py-2 rounded-xl focus:ring-2 outline-none w-full sm:flex-1 text-gray-700 shadow-sm`}
            />
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className={`border ${colors.inputBorder} px-4 py-2 rounded-xl focus:ring-2 outline-none w-full sm:flex-1 text-gray-700 shadow-sm bg-white`}
            >
              <option value="">Select a Model</option>
              <option value="Logistic Regression">Logistic Regression</option>
              <option value="Random Forest">Random Forest</option>
              <option value="Decision Tree">Decision Tree</option>
              <option value="KNN">KNN</option>
              <option value="Linear Regression">Linear Regression</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <motion.button
              onClick={handleTrain}
              className={`${colors.secondaryGradient} text-white px-8 py-3 rounded-xl font-semibold shadow-lg flex items-center gap-2 ${colors.hoverScale} ${colors.activeScale} transition duration-300 ease-in-out`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <FiCpu className="text-xl" /> Train Selected Model
            </motion.button>
            <motion.button
              onClick={handleTrainAll}
              className={`bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:from-teal-600 hover:to-emerald-700 ${colors.hoverScale} ${colors.activeScale} transition duration-300 ease-in-out flex items-center gap-2`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <FiActivity className="text-xl" /> Train All & Pick Best
            </motion.button>
          </div>

          <AnimatePresence>
            {trainResult && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: 20 }}
                className="mt-6 bg-blue-100 p-5 rounded-2xl shadow-inner text-sm text-blue-800 border border-blue-300 overflow-hidden"
              >
                <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Training Results:
                </h3>
                <ul className="list-none space-y-2">
                  <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <strong>Model Trained:</strong> <span className="font-semibold text-blue-900">{trainResult.model}</span>
                  </motion.li>
                  <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <strong>Task Type:</strong> <span className="font-semibold text-blue-900 capitalize">{trainResult.task}</span>
                  </motion.li>
                  {trainResult.task === "classification" ? (
                    <>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                        <strong>Accuracy:</strong> <span className="font-semibold">{trainResult.accuracy?.toFixed(4)}</span>
                      </motion.li>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                        <strong>Precision (Weighted):</strong> <span className="font-semibold">{trainResult.precision?.toFixed(4)}</span>
                      </motion.li>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                        <strong>Recall (Weighted):</strong> <span className="font-semibold">{trainResult.recall?.toFixed(4)}</span>
                      </motion.li>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                        <strong>F1 Score (Weighted):</strong> <span className="font-semibold">{trainResult.f1_score?.toFixed(4)}</span>
                      </motion.li>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="pt-2">
                        <strong className="block mb-1">Confusion Matrix:</strong>
                        <pre className="whitespace-pre-wrap bg-white p-3 rounded-lg border border-blue-200 overflow-x-auto text-xs font-mono shadow-sm">
                          {JSON.stringify(trainResult.confusion_matrix, null, 2)}
                        </pre>
                      </motion.li>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
                        <strong className="block mb-1">Classes:</strong>
                        <span className="font-semibold">{trainResult.classes?.join(", ")}</span>
                      </motion.li>
                    </>
                  ) : (
                    <>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                        <strong>Mean Squared Error:</strong> <span className="font-semibold">{trainResult.mean_squared_error?.toFixed(4)}</span>
                      </motion.li>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                        <strong>Mean Absolute Error:</strong> <span className="font-semibold">{trainResult.mean_absolute_error?.toFixed(4)}</span>
                      </motion.li>
                      <motion.li initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                        <strong>R² Score:</strong> <span className="font-semibold">{trainResult.r2_score?.toFixed(4)}</span>
                      </motion.li>
                    </>
                  )}
                </ul>
              </motion.div>
            )}

            {trainAllResult?.best_model && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                className="mt-6 p-5 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl border border-orange-300 shadow-xl overflow-hidden"
              >
                <h3 className="text-2xl font-bold text-orange-800 mb-3 flex items-center gap-2">
                  🏆 Best Model Found: <span className="text-orange-900">{trainAllResult.best_model}</span>
                </h3>
                <div className="text-sm text-orange-700">
                  <p className="mb-2"><strong>Overall Best Score:</strong> <span className="font-semibold text-lg text-orange-900">{trainAllResult.score?.toFixed(4)}</span></p>
                  <strong className="block mt-2 mb-1 text-lg">Key Metrics:</strong>
                  <pre className="whitespace-pre-wrap bg-white p-3 rounded-lg border border-orange-200 overflow-x-auto text-xs font-mono shadow-sm">
                    {JSON.stringify(trainAllResult.metrics, null, 2)}
                  </pre>
                  <strong className="block mt-3 mb-1 text-lg">All Models Evaluation:</strong>
                  <div className="max-h-60 overflow-y-auto bg-white p-3 rounded-lg border border-orange-200 shadow-sm">
                    <pre className="whitespace-pre-wrap text-xs font-mono">
                      {JSON.stringify(trainAllResult.all_models, null, 2)}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Prediction Section */}
        <motion.section
          className="p-6 rounded-2xl shadow-lg border border-green-200 transition-all duration-300 ease-in-out hover:shadow-xl"
          style={{ backgroundImage: "linear-gradient(to right bottom, #f0fdf4, #dcfce7)" }}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-green-800 text-3xl font-bold mb-4 flex items-center gap-2">
            <FiActivity className="text-green-500 text-4xl" /> 3. Make Predictions
          </h2>
          <div className="flex items-center gap-6 mb-5 font-semibold text-green-700">
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                checked={predictMode === "file"}
                onChange={() => setPredictMode("file")}
                className="form-radio text-green-600 h-5 w-5 transition duration-200 ease-in-out group-hover:scale-110"
              />
              <span className="ml-2">Predict From File</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                checked={predictMode === "manual"}
                onChange={() => setPredictMode("manual")}
                className="form-radio text-green-600 h-5 w-5 transition duration-200 ease-in-out group-hover:scale-110"
              />
              <span className="ml-2">Predict With Manual Input</span>
            </label>
          </div>

          <input
            type="text"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            placeholder="Enter Trained Model Name (e.g., Logistic Regression)"
            className={`border ${colors.inputBorder} px-4 py-2 rounded-xl focus:ring-2 outline-none mb-4 block w-full text-gray-700 shadow-sm`}
          />

          {predictMode === "file" && (
            <label className="block w-full sm:w-auto cursor-pointer bg-white border border-dashed border-green-400 rounded-lg p-4 text-center text-green-600 hover:border-green-600 transition duration-300 ease-in-out mb-4 shadow-inner">
              <input type="file" onChange={handlePredictFileUpload} className="hidden" accept=".csv" />
              <FiUploadCloud className="mx-auto text-5xl mb-2 text-green-400" />
              <span className="font-semibold text-lg">
                {predictFile ? predictFile.name : "Choose a CSV file for prediction"}
              </span>
              <p className="text-sm text-gray-500 mt-1">Max 50MB, CSV only</p>
            </label>
          )}

          {predictMode === "manual" && (
            <div className="mb-4 p-4 bg-white rounded-lg shadow-inner border border-green-100">
              <motion.button
                onClick={fetchInputFeatures}
                className="bg-gray-700 text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:bg-gray-800 transition duration-300 ease-in-out flex items-center gap-2 mb-4"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <FiInfo className="text-xl" /> Get Required Features
              </motion.button>
              {inputFeatures.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, staggerChildren: 0.05 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {inputFeatures.map((f, idx) => (
                    <motion.input
                      key={idx}
                      placeholder={f}
                      value={inputValues[f] || ""}
                      onChange={(e) => setInputValues({ ...inputValues, [f]: e.target.value })}
                      className={`border ${colors.inputBorder} p-3 rounded-lg focus:ring-2 outline-none text-gray-700 shadow-sm`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          )}

          <motion.button
            onClick={handlePredict}
            className={`${colors.accentGradient} text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:from-green-600 hover:to-emerald-700 ${colors.hoverScale} ${colors.activeScale} transition duration-300 ease-in-out flex items-center gap-2`}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiArrowRightCircle className="text-xl" /> Get Prediction
          </motion.button>

          <AnimatePresence>
            {prediction && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: 20 }}
                className="mt-6 bg-green-100 p-5 rounded-2xl shadow-inner border border-green-300 text-green-800 overflow-hidden"
              >
                <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Prediction Result:
                </h3>
                {prediction.predictions && (
                  <motion.ul
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                    }}
                    className="list-disc list-inside space-y-1"
                  >
                    {prediction.predictions.map((p, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        Row {idx + 1}: <span className="font-semibold text-green-900">{p}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
                {typeof prediction.prediction !== "undefined" && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-semibold"
                  >
                    Single Prediction: <span className="text-green-900 text-xl">{prediction.prediction}</span>
                  </motion.p>
                )}
                {prediction.error && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 font-semibold flex items-center gap-2"
                  >
                    <FiAlertTriangle /> Error: {prediction.error}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default ThemedMLDashboard;