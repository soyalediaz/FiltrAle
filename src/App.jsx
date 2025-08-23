import { useState } from 'react'
import ImageUploader from './components/ImageUploader'
import ImageProcessor from './components/ImageProcessor'
import ProcessedImages from './components/ProcessedImages'
import './App.css'

function App() {
  const [images, setImages] = useState([])
  const [processedImages, setProcessedImages] = useState([])
  const [gradientIntensity, setGradientIntensity] = useState(0.7)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleImagesUpload = (uploadedImages) => {
    setImages(uploadedImages)
    setProcessedImages([])
  }

  const handleImageProcessed = (originalImage, processedImageData) => {
    setProcessedImages(prev => {
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
  }

  const handleDownloadAll = async () => {
    setIsDownloading(true)
    
    try {
      // En móviles, descargar una por una con delay
      for (let i = 0; i < processedImages.length; i++) {
        const item = processedImages[i]
        const link = document.createElement('a')
        link.download = `filtro-foto-${i + 1}.png`
        link.href = item.processed
        
        // Agregar al DOM temporalmente
        document.body.appendChild(link)
        link.click()
        
        // Remover del DOM
        document.body.removeChild(link)
        
        // Delay entre descargas para evitar bloqueos en móvil
        if (i < processedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } finally {
      setIsDownloading(false)
    }
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
        <section className="upload-section">
          <ImageUploader 
            onImagesUpload={handleImagesUpload}
            maxFiles={10}
          />
        </section>

        {images.length > 0 && (
          <section className="controls-section">
            <div className="controls">
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
                />
                <span>{Math.round(gradientIntensity * 100)}%</span>
              </div>
            </div>
          </section>
        )}

        {processedImages.length > 0 && (
          <section className="results-section">
            <ProcessedImages
              processedImages={processedImages}
              onDownloadAll={handleDownloadAll}
              isDownloading={isDownloading}
            />
          </section>
        )}
      </main>

      {/* Modal de procesamiento - fuera del main para que aparezca sobre todo */}
      <ImageProcessor
        images={images}
        gradientIntensity={gradientIntensity}
        onImageProcessed={handleImageProcessed}
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
