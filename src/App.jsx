import { useState, useCallback } from 'react'
import ImageUploader from './components/ImageUploader'
import ImageProcessor from './components/ImageProcessor'
import ProcessedImages from './components/ProcessedImages'
import { cleanupImageUrl } from './utils/imageEffects'
import './App.css'

function App() {
  const [images, setImages] = useState([])
  const [processedImages, setProcessedImages] = useState([])
  const [gradientIntensity, setGradientIntensity] = useState(0.5)
  const [gradientColor, setGradientColor] = useState('#000000')
  const [logoPosition, setLogoPosition] = useState('bottom')
  const [processingImages, setProcessingImages] = useState(new Set())

  const handleImagesUpload = useCallback((uploadedImages) => {
    // Agregar las nuevas imágenes a las existentes
    setImages(prevImages => [...prevImages, ...uploadedImages])
    setProcessingImages(new Set())
  }, [])

  const handleProcessingStart = useCallback((imageId) => {
    setProcessingImages(prev => new Set(prev).add(imageId))
  }, [])

  const handleImageProcessed = useCallback((originalImage, processedImageData) => {
    setProcessedImages(prev => {
      // Limpiar URL anterior si existe
      const existingItem = prev.find(item => item.original.id === originalImage.id)
      if (existingItem) {
        cleanupImageUrl(existingItem.processed)
      }
      
      // Evitar duplicados basados en el ID de la imagen original
      const exists = prev.some(item => item.original.id === originalImage.id)
      if (exists) {
        // Reemplazar la imagen existente con la nueva versión procesada
        return prev.map(item => 
          item.original.id === originalImage.id 
            ? { original: originalImage, processed: processedImageData }
            : item
        )
      } else {
        // Agregar nueva imagen procesada
        return [...prev, { original: originalImage, processed: processedImageData }]
      }
    })
    
    // Remover de procesamiento
    setProcessingImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(originalImage.id)
      return newSet
    })
  }, [])


  const handleClearAll = () => {
    // Limpiar todas las URLs
    processedImages.forEach(item => {
      cleanupImageUrl(item.processed)
    })
    setImages([])
    setProcessedImages([])
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <img 
              src="/logo-filtrale.webp" 
              alt="Filtrale Logo" 
              className="logo-image"
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="desktop-layout">
          <div className="main-content">
            <section className="upload-section">
              <ImageUploader
                onImagesUpload={handleImagesUpload}
                maxFiles={10}
              />
            </section>

            {processedImages.length > 0 && (
              <section className="results-section">
                <ProcessedImages
                  processedImages={processedImages}
                  processingImages={processingImages}
                />
              </section>
            )}
          </div>

          {images.length > 0 && (
            <aside className="controls-sidebar">
              <div className="controls">
                <h3 className="controls-title">Personalización</h3>

                <div className="intensity-control">
                  <label htmlFor="intensity">Intensidad del degradado:</label>
                  <input
                    id="intensity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={gradientIntensity}
                    onChange={(e) => setGradientIntensity(parseFloat(e.target.value))}
                    aria-label={`Intensidad del degradado: ${Math.round(gradientIntensity * 100)}%`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={Math.round(gradientIntensity * 100)}
                  />
                  <span role="status" aria-live="polite">{Math.round(gradientIntensity * 100)}%</span>
                </div>

                <div className="color-control">
                  <label htmlFor="gradientColor">Color del degradado:</label>
                  <div className="color-input-wrapper">
                    <input
                      id="gradientColor"
                      type="color"
                      value={gradientColor}
                      onChange={(e) => setGradientColor(e.target.value)}
                      className="color-picker"
                      aria-label={`Color del degradado: ${gradientColor}`}
                    />
                    <span className="color-label" role="status" aria-live="polite">{gradientColor}</span>
                  </div>
                </div>

                <div className="logo-position-control">
                  <label htmlFor="logoPosition">Posición de los logos:</label>
                  <select
                    id="logoPosition"
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value)}
                    className="logo-select"
                    aria-label="Posición de los logos en la imagen"
                  >
                    <option value="bottom">Abajo</option>
                    <option value="top">Arriba</option>
                    <option value="middle">Centro</option>
                  </select>
                </div>

                <div className="actions-buttons">
                  <button
                    className="clear-btn"
                    onClick={handleClearAll}
                    title="Limpiar todas las imágenes"
                  >
                    Limpiar Todo
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Modal de procesamiento - fuera del main para que aparezca sobre todo */}
      <ImageProcessor
        images={images}
        gradientIntensity={gradientIntensity}
        gradientColor={gradientColor}
        logoPosition={logoPosition}
        onImageProcessed={handleImageProcessed}
        onProcessingStart={handleProcessingStart}
      />

      <footer className="app-footer">
        <p>
          Página creada por{' '}
          <a 
            href="https://aleke.com.ar" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            Alekey Desarrollo Web
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
