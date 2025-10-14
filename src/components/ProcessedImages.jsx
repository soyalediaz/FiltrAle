import { useState } from 'react'
import styles from './ProcessedImages.module.css'

const ProcessedImages = ({ processedImages, processingImages }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  const handleDownload = async (imageData, index) => {
    try {
      // Crear nombre del archivo
      const filename = `filtro-foto-${index + 1}.png`
      
      // Detectar si es móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      
      // Obtener la imagen del blob URL
      const response = await fetch(imageData.processed)
      const blob = await response.blob()
      
      // Crear imagen desde el blob
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const blobUrl = URL.createObjectURL(blob)
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Crear canvas para reprocessar la imagen
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            
            // Para iOS y Safari: usar canvas.toDataURL
            if (isIOS) {
              try {
                // Intentar descargar con data URL
                const dataUrl = canvas.toDataURL('image/png', 1.0)
                const link = document.createElement('a')
                link.href = dataUrl
                link.download = filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                
                URL.revokeObjectURL(blobUrl)
                resolve()
              } catch (err) {
                console.error('Error con dataURL, intentando con blob', err)
                // Fallback a blob
                canvas.toBlob((canvasBlob) => {
                  if (canvasBlob) {
                    const url = URL.createObjectURL(canvasBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = filename
                    document.body.appendChild(link)
                    link.click()
                    
                    setTimeout(() => {
                      document.body.removeChild(link)
                      URL.revokeObjectURL(url)
                      URL.revokeObjectURL(blobUrl)
                      resolve()
                    }, 100)
                  }
                }, 'image/png', 1.0)
              }
            }
            // Para Android y otros dispositivos móviles
            else if (isMobile) {
              canvas.toBlob((canvasBlob) => {
                if (canvasBlob) {
                  const url = URL.createObjectURL(canvasBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = filename
                  link.style.display = 'none'
                  
                  document.body.appendChild(link)
                  link.click()
                  
                  setTimeout(() => {
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    URL.revokeObjectURL(blobUrl)
                    resolve()
                  }, 100)
                } else {
                  reject(new Error('Error generando blob'))
                }
              }, 'image/png', 1.0)
            }
            // Para desktop
            else {
              canvas.toBlob((canvasBlob) => {
                if (canvasBlob) {
                  const url = URL.createObjectURL(canvasBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = filename
                  
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  
                  URL.revokeObjectURL(url)
                  URL.revokeObjectURL(blobUrl)
                  resolve()
                } else {
                  reject(new Error('Error generando blob'))
                }
              }, 'image/png', 1.0)
            }
          } catch (error) {
            console.error('Error en canvas:', error)
            URL.revokeObjectURL(blobUrl)
            reject(error)
          }
        }
        
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl)
          reject(new Error('Error cargando imagen'))
        }
        
        img.src = blobUrl
      })
    } catch (error) {
      console.error('Error descargando imagen:', error)
      alert('Error al descargar. Por favor, intente de nuevo.')
      throw error
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