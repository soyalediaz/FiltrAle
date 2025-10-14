import { useState } from 'react'
import styles from './ProcessedImages.module.css'

const ProcessedImages = ({ processedImages, processingImages }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  const handleDownload = async (imageData, index) => {
    try {
      // Convertir blob URL a blob real
      const response = await fetch(imageData.processed)
      const blob = await response.blob()

      // Crear nombre del archivo
      const filename = `filtro-foto-${index + 1}.png`

      // Detectar si es móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

      // Para iOS y Safari móvil - usar Canvas para forzar descarga
      if (isMobile && (isIOS || isSafari)) {
        // Crear una imagen desde el blob
        const img = new Image()
        const blobUrl = URL.createObjectURL(blob)
        
        img.onload = () => {
          // Crear canvas con las dimensiones de la imagen
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          
          // Convertir canvas a data URL
          canvas.toBlob((canvasBlob) => {
            const url = URL.createObjectURL(canvasBlob)
            
            // Crear link temporal
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.style.display = 'none'
            
            // Simular click con evento táctil
            document.body.appendChild(link)
            
            // Crear evento de click programático
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            })
            
            link.dispatchEvent(clickEvent)
            
            // Limpiar después de un delay
            setTimeout(() => {
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
              URL.revokeObjectURL(blobUrl)
            }, 100)
          }, 'image/png', 1.0)
        }
        
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl)
          // Fallback: abrir en nueva pestaña
          window.open(imageData.processed, '_blank')
        }
        
        img.src = blobUrl
      }
      // Para Android y otros móviles
      else if (isMobile) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.style.display = 'none'
        
        document.body.appendChild(link)
        
        // Forzar descarga con evento touch
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
        
        link.dispatchEvent(event)
        
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 100)
      }
      // Para desktop
      else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error descargando imagen:', error)
      alert('Error al descargar. Intente mantener presionada la imagen y seleccionar "Guardar imagen".')
    }
  }

  const openModal = (imageData, index) => {
    setSelectedImage({ ...imageData, index })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedImage(null)
  }

  const handleModalDownload = () => {
    if (selectedImage) {
      handleDownload(selectedImage, selectedImage.index)
    }
  }

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true)

    try {
      // Detectar si es móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        // En móviles, descargar con delay más largo para evitar bloqueos
        for (let i = 0; i < processedImages.length; i++) {
          await handleDownload(processedImages[i], i)
          // Delay más largo en móviles para dar tiempo al navegador
          if (i < processedImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      } else {
        // En desktop, descarga más rápida
        for (let i = 0; i < processedImages.length; i++) {
          await handleDownload(processedImages[i], i)
          if (i < processedImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
      }
      
      alert(`${processedImages.length} imagen(es) procesada(s). Revise su carpeta de descargas.`)
    } catch (error) {
      console.error('Error descargando imágenes:', error)
      alert('Error al descargar las imágenes. Intente descargarlas individualmente.')
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const isProcessing = (imageId) => {
    return processingImages && processingImages.has(imageId)
  }

  return (
    <div className={styles.processedImages}>
      <div className={styles.imagesHeader}>
        <h3>Imágenes Procesadas ({processedImages.length})</h3>
        <button
          className={`${styles.downloadAllBtn} ${isDownloadingAll ? styles.downloading : ''}`}
          onClick={handleDownloadAll}
          disabled={isDownloadingAll}
        >
          {isDownloadingAll ? 'Descargando...' : 'Descargar Todas'}
        </button>
      </div>
      
      <div className={styles.imagesGrid}>
        {processedImages.map((imageData, index) => {
          const processing = isProcessing(imageData.original.id)
          return (
            <div key={index} className={`${styles.imageItem} ${processing ? styles.processing : ''}`}>
              <div 
                className={styles.imageContainer}
                onClick={() => {
                  if (!processing) {
                    openModal(imageData, index)
                  }
                }}
                style={{ cursor: processing ? 'default' : 'pointer' }}
              >
                {processing ? (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <p>Procesando...</p>
                  </div>
                ) : (
                  <img
                    src={imageData.processed}
                    alt={`Imagen procesada ${index + 1}`}
                    className={styles.processedImage}
                  />
                )}
              </div>
              <p className={styles.imageName}>{imageData.original.name}</p>
            </div>
          )
        })}
      </div>

      {/* Modal de vista previa */}
      {modalOpen && selectedImage && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeModal}>×</button>
            <div className={styles.modalImageContainer}>
              <img
                src={selectedImage.processed}
                alt={`Vista previa ${selectedImage.index + 1}`}
                className={styles.modalImage}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalDownloadBtn}
                onClick={handleModalDownload}
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProcessedImages 