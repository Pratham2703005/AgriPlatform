# CropLab-ML: AI-Powered Crop Yield Prediction API

## 🌾 Overview

CropLab-ML is an advanced machine learning system that predicts crop yields using satellite imagery (NDVI) and soil sensor data. The system combines Google Earth Engine satellite data processing with deep learning models to provide accurate crop yield predictions and visual heatmaps for precision agriculture.

## 🚀 Key Features

- **Real-time Crop Yield Prediction**: Uses CNN+LSTM models trained on NDVI and soil sensor data
- **Visual Heatmap Generation**: Color-coded maps showing crop health and yield potential
- **Google Earth Engine Integration**: Automatic satellite data fetching and processing
- **Multi-sensor Soil Analysis**: 5 soil parameters (ECe, N, P, pH, OC) for comprehensive analysis
- **Location-based Insights**: District-specific yield comparisons and farming recommendations
- **Robust Fallback System**: Graceful error handling ensuring API availability

---

## 📊 Architecture Overview

```mermaid
graph TB
    A[Client Request] --> B[FastAPI Endpoint]
    B --> C[Service Singleton]
    C --> D[Google Earth Engine]
    C --> E[ML Model Pipeline]
    
    D --> F[NDVI Data Processing]
    D --> G[Soil Sensor Data]
    
    F --> H[Data Preprocessing]
    G --> H
    
    H --> I[CNN+LSTM Model]
    I --> J[Yield Prediction]
    
    J --> K[Heatmap Generation]
    J --> L[Farmer Recommendations]
    
    K --> M[Color-coded Masks]
    L --> N[Location-based Insights]
    
    M --> O[Base64 Encoded Images]
    N --> O
    O --> P[JSON Response]
```

---

## 🔥 `/generate_heatmap` API Pipeline

The `/generate_heatmap` endpoint is the core functionality that combines satellite data processing, machine learning inference, and visualization to provide comprehensive crop analysis.

### 📥 Input Format

```json
{
  "coordinates": [
    [longitude1, latitude1],
    [longitude2, latitude2],
    [longitude3, latitude3],
    [longitude4, latitude4]
  ],
  "t1": 0.3,  // Lower threshold for yield classification
  "t2": 0.6   // Upper threshold for yield classification
}
```

### 📤 Output Format

```json
{
  "predicted_yield": 2847.5,
  "old_yield": 2650.0,
  "growth": {
    "ratio": 1.074,
    "percentage": 7.45
  },
  "location": {
    "district": "Agra",
    "coordinates": {
      "latitude": 27.1767,
      "longitude": 78.0081
    },
    "complete_address": "Agra, Uttar Pradesh, India"
  },
  "ndvi_shape": [315, 316],
  "sensor_shape": [315, 316, 5],
  "masks": {
    "red_mask_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "yellow_mask_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "green_mask_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
  },
  "pixel_counts": {
    "valid": 99856,
    "red": 15632,
    "yellow": 42108,
    "green": 42116
  },
  "thresholds": {
    "t1": 0.3,
    "t2": 0.6
  },
  "suggestions": [
    "Focus on red zones: Apply nitrogen-rich fertilizers",
    "Monitor soil moisture in yellow areas",
    "Maintain current practices in green zones"
  ]
}
```

---

## 🔄 Detailed ML Pipeline Flow

### 1. **Service Initialization (Singleton Pattern)**

```mermaid
graph LR
    A[App Startup] --> B[Singleton Service]
    B --> C[Load TensorFlow Model]
    B --> D[Load Scaler]
    B --> E[Initialize Google Earth Engine]
    
    C --> F[Model Ready]
    D --> G[Scaler Ready]
    E --> H[GEE Ready]
    
    F --> I[Service Ready]
    G --> I
    H --> I
```

**Components:**
- **TensorFlow Model**: CNN+LSTM architecture for yield prediction
- **Scaler**: StandardScaler for soil sensor data normalization
- **Google Earth Engine**: Satellite data access and processing

### 2. **Data Acquisition Pipeline**

```mermaid
graph TD
    A[Polygon Coordinates] --> B[Create GeoJSON Feature]
    B --> C[Google Earth Engine Query]
    
    C --> D[Search Satellite Images]
    D --> E[Filter by Date Range]
    E --> F[Filter by Cloud Coverage]
    F --> G[Select Best Image]
    
    G --> H[Extract NDVI Bands]
    G --> I[Extract Soil Sensor Data]
    
    H --> J[Calculate NDVI Values]
    I --> K[Process 5 Soil Parameters]
    
    J --> L[Export as NumPy Array]
    K --> L
    
    L --> M[Data Preprocessing]
```

**Data Sources:**
- **Satellite Data**: Landsat/Sentinel imagery from Google Earth Engine
- **NDVI Calculation**: (NIR - Red) / (NIR + Red) vegetation index
- **Soil Sensors**: ECe, N, P, pH, OC parameters from pre-trained assets

### 3. **Machine Learning Inference**

```mermaid
graph TD
    A[NDVI Data] --> B[Resize to 315x316]
    C[Sensor Data] --> D[Resize to 315x316x5]
    
    B --> E[Add Batch Dimension]
    D --> F[Add Batch Dimension]
    
    E --> G[NDVI Preprocessing]
    F --> H[Sensor Scaling]
    
    G --> I[CNN+LSTM Model]
    H --> I
    
    I --> J[Yield Prediction]
    J --> K[Post-processing]
    K --> L[Final Yield Value]
```

**Model Architecture:**
- **Input 1**: NDVI data (1, 315, 316, 1)
- **Input 2**: Soil sensor data (1, 315, 316, 5)
- **Model Type**: Hybrid CNN+LSTM for spatial-temporal analysis
- **Output**: Single yield prediction value

### 4. **Heatmap Generation Process**

```mermaid
graph TD
    A[NDVI Data] --> B[Yield Comparison]
    C[Predicted Yield] --> B
    D[Historical Yield] --> B
    
    B --> E[Calculate Yield Ratio]
    E --> F[Adjust NDVI Values]
    
    F --> G[Apply Thresholds]
    G --> H[Classify Pixels]
    
    H --> I[Red Mask: Low Yield]
    H --> J[Yellow Mask: Medium Yield]
    H --> K[Green Mask: High Yield]
    
    I --> L[Convert to PNG]
    J --> L
    K --> L
    
    L --> M[Base64 Encoding]
    M --> N[Return to Client]
```

**Color Classification:**
- **Red (Low Yield)**: NDVI < t1 threshold
- **Yellow (Medium Yield)**: t1 ≤ NDVI < t2 threshold  
- **Green (High Yield)**: NDVI ≥ t2 threshold

### 5. **Location Intelligence & Recommendations**

```mermaid
graph TD
    A[Coordinates] --> B[Reverse Geocoding]
    B --> C[Extract District]
    
    C --> D[Load Historical Data]
    D --> E[Compare with Current Prediction]
    
    E --> F[Calculate Growth %]
    F --> G[Analyze Pixel Distribution]
    
    G --> H[Soil Parameter Analysis]
    H --> I[Generate Recommendations]
    
    I --> J[Field Management Tips]
    I --> K[Fertilizer Suggestions]
    I --> L[Risk Alerts]
```

---

## 🧠 Machine Learning Components

### 1. **Data Preprocessing**

**NDVI Processing:**
- Normalization: Values scaled to 0-1 range
- Resizing: Standardized to 315×316 pixels
- Channel expansion: 2D → 3D array

**Sensor Data Processing:**
- 5 soil parameters: ECe, N, P, pH, OC
- StandardScaler normalization
- Channel alignment with model expectations

### 2. **Model Architecture**

```python
# Simplified model structure
inputs = [
    NDVI_Input(shape=(315, 316, 1)),
    Sensor_Input(shape=(315, 316, 5))
]

# CNN layers for spatial feature extraction
# LSTM layers for temporal pattern recognition
# Dense layers for yield prediction

output = Dense(1, activation='linear')(features)
```

**Key Features:**
- **Multi-input**: Handles both NDVI and sensor data
- **Spatial Analysis**: CNN layers extract spatial patterns
- **Temporal Modeling**: LSTM captures seasonal variations
- **Robust Training**: Trained on diverse agricultural datasets

### 3. **Prediction Post-processing**

**Yield Adjustment:**
```python
yield_ratio = predicted_yield / historical_yield
adjusted_ndvi = original_ndvi * yield_ratio
```

**Quality Assurance:**
- Fallback predictions for model failures
- Data validation and error handling
- Graceful degradation for missing data

---

## 🎯 Heatmap Visualization

### Color Coding System

| Color | NDVI Range | Interpretation | Action Required |
|-------|------------|----------------|-----------------|
| 🔴 Red | < t1 (0.3) | Low vegetation health | Immediate intervention needed |
| 🟡 Yellow | t1-t2 (0.3-0.6) | Moderate vegetation | Monitor and optimize |
| 🟢 Green | > t2 (0.6) | Healthy vegetation | Maintain current practices |

### Mask Generation Process

1. **Pixel Classification**: Each pixel classified based on NDVI value
2. **Color Assignment**: RGB values assigned per classification
3. **Transparency**: Alpha channel for overlay capability
4. **Encoding**: PNG format with base64 encoding for web delivery

---

## 🔧 API Endpoints

### Health Check
```http
GET /health
```
Returns service status and component readiness.

### Crop Yield Prediction
```http
POST /predict
```
Returns yield prediction without heatmap visualization.

### Heatmap Generation (Main Feature)
```http
POST /generate_heatmap
```
Complete pipeline including prediction and visualization.

### Array Export
```http
POST /export_arrays
```
Utility endpoint for raw NDVI and sensor data export.

---

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- TensorFlow 2.x
- Google Earth Engine account
- Required dependencies (see requirements.txt)

### Environment Variables
```bash
GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
GEE_PROJECT_ID=your-project-id
```

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Docker Deployment
```bash
# Build image
docker build -t croplab-ml .

# Run container
docker run -p 8000:8000 croplab-ml
```

---

## 📈 Performance & Scalability

### Optimization Features
- **Singleton Pattern**: Single model loading for all requests
- **Memory Management**: TensorFlow memory growth configuration
- **Fallback System**: Graceful error handling and default responses
- **Caching**: Efficient data processing and reuse

### Response Times
- **NDVI Data Fetch**: ~2-5 seconds
- **Model Inference**: ~100-500ms
- **Heatmap Generation**: ~1-3 seconds
- **Total Pipeline**: ~5-10 seconds

---

## 🔍 Error Handling & Monitoring

### Robust Fallback System
- Model loading failures → Lightweight replacement model
- Data fetching errors → Default values with warnings
- Processing failures → Simplified alternatives
- Network issues → Cached or generated responses

### Logging & Monitoring
- Comprehensive error logging
- Performance metrics tracking
- Health check endpoints
- Status monitoring dashboard

---

## 🌱 Use Cases & Applications

### Precision Agriculture
- **Field Assessment**: Identify problematic areas in crops
- **Resource Optimization**: Target fertilizer and water application
- **Yield Forecasting**: Plan harvest and market strategies

### Agricultural Research
- **Crop Monitoring**: Track vegetation health over time
- **Climate Impact**: Assess weather effects on crop performance
- **Variety Testing**: Compare different crop varieties

### Farm Management
- **Decision Support**: Data-driven farming decisions
- **Risk Management**: Early warning for crop issues
- **Productivity Enhancement**: Optimize farming practices

---

## 🔮 Future Enhancements

### Planned Features
- **Multi-crop Support**: Extend beyond single crop type
- **Temporal Analysis**: Historical trend analysis
- **Weather Integration**: Real-time weather data incorporation
- **Mobile App**: Dedicated mobile application
- **IoT Integration**: Direct sensor data integration

### Model Improvements
- **Higher Resolution**: Support for higher resolution imagery
- **Real-time Processing**: Faster inference and processing
- **Multi-modal Data**: Integration of additional data sources
- **Advanced Analytics**: More sophisticated analysis features

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and submit pull requests for any improvements.

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support & Contact

For questions, issues, or collaboration opportunities:
- **GitHub Issues**: Report bugs and feature requests
- **Email**: [Contact information]
- **Documentation**: [Additional documentation links]

---

*Built with ❤️ for sustainable agriculture and food security*
