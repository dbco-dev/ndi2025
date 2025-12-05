import { useState, useEffect } from 'react'
import Window from '../blocks/window'
import Txt from '../layouts/txt'
import Odt from '../layouts/odt'
import Pdf from '../layouts/pdf'

type FileEntry = {
  fileName: string
  path: string
  snippet: string
  questionId: string
}

type FilesData = {
  [key: string]: FileEntry[]
}

function Files({ title, initialPosition, onClose, onClick, shouldBlink }: { uuid: number, title: string, initialPosition: { x: number, y: number }, initialSize: { width: number, height: number }, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink: boolean }) {
  const [filesData, setFilesData] = useState<FilesData>({})
  const [currentPath, setCurrentPath] = useState('Bureau')
  const [openedFiles, setOpenedFiles] = useState<Array<{ id: number; type: string; fileName: string; snippet: string }>>([])

  useEffect(() => {
    // Charger le JSON des fichiers
    fetch('/assets/medias/files.json')
      .then(res => res.json())
      .then(data => setFilesData(data))
      .catch(err => console.error('Erreur chargement fichiers:', err))
  }, [])

  // Extraire les dossiers uniques
  const getAllPaths = () => {
    const paths = new Set(['Bureau'])
    Object.values(filesData).forEach((fileList: FileEntry[]) => {
      fileList.forEach(f => paths.add(f.path))
    })
    return Array.from(paths).sort()
  }

  // Obtenir les fichiers du dossier courant
  const getFilesInCurrentPath = () => {
    const files: { type: string; data: FileEntry }[] = []
    Object.entries(filesData).forEach(([ext, fileList]) => {
      fileList.forEach(f => {
        if (f.path === currentPath) {
          files.push({ type: ext, data: f })
        }
      })
    })
    return files
  }

  // Obtenir les sous-dossiers (distinct des chemins commençant par le dossier courant)
  const getSubfolders = () => {
    const allPaths = getAllPaths()
    const subfolders = new Set<string>()
    allPaths.forEach(p => {
      if (p.startsWith(currentPath + '/')) {
        const subPath = p.substring(currentPath.length + 1).split('/')[0]
        subfolders.add(subPath)
      }
    })
    return Array.from(subfolders).sort()
  }

  const handleOpenFile = (type: string, data: FileEntry) => {
    const newFileId = Date.now()
    setOpenedFiles(prev => [...prev, { id: newFileId, type, fileName: data.fileName, snippet: data.snippet }])
  }

  const handleCloseFile = (id: number) => {
    setOpenedFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleNavigate = (folderName: string) => {
    setCurrentPath(folderName)
  }

  const getFileIcon = (ext: string) => {
    switch (ext) {
      case '.txt':
        return '📄'
      case '.pdf':
        return '📕'
      case '.odt':
        return '📗'
      default:
        return '📁'
    }
  }

  return (
    <>
      <Window title={title} initialPosition={initialPosition} initialSize={{ width: 700, height: 450 }} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
        <div className="w-full h-full bg-white flex">
          {/* Sidebar - Dossiers principaux */}
          <div className="w-40 bg-zinc-100 border-r border-zinc-300 flex flex-col overflow-y-auto">
            <div className="text-xs font-semibold px-3 py-2 bg-zinc-200 border-b border-zinc-300">Dossiers</div>
            {getAllPaths().map(folder => (
              <div
                key={`sidebar-${folder}`}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs ${
                  currentPath === folder
                    ? 'bg-blue-200 text-blue-900 font-semibold'
                    : 'hover:bg-zinc-200 text-zinc-700'
                }`}
                onClick={() => handleNavigate(folder)}
              >
                <span>📁</span>
                <span className="truncate">{folder}</span>
              </div>
            ))}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col p-3">
            {/* Breadcrumb */}
            <div className="text-xs font-semibold text-zinc-700 mb-3 pb-2 border-b border-zinc-200">
              {currentPath}
            </div>

            {/* File/Folder List */}
            <div className="flex-1 overflow-y-auto">
              {/* Subfolders */}
              {getSubfolders().map(folder => (
                <div
                  key={`folder-${folder}`}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-blue-100 cursor-pointer rounded text-xs"
                  onClick={() => handleNavigate(`${currentPath}/${folder}`)}
                >
                  <span>📁</span>
                  <span className="font-medium text-zinc-700">{folder}</span>
                </div>
              ))}

              {/* Files */}
              {getFilesInCurrentPath().map((file, idx) => (
                <div
                  key={`file-${idx}`}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-blue-50 cursor-pointer rounded text-xs"
                  onClick={() => handleOpenFile(file.type, file.data)}
                >
                  <span>{getFileIcon(file.type)}</span>
                  <span className="text-zinc-700">{file.data.fileName}</span>
                </div>
              ))}

              {/* Message si vide */}
              {getSubfolders().length === 0 && getFilesInCurrentPath().length === 0 && (
                <div className="text-xs text-zinc-500 italic">Dossier vide</div>
              )}
            </div>
          </div>
        </div>
      </Window>

      {openedFiles.map((openedFile, idx) => {
        const offsetX = 250 + idx * 30
        const offsetY = 80 + idx * 30
        return (
          <div key={openedFile.id}>
            {openedFile.type === '.txt' && (
              <Txt
                uuid={openedFile.id}
                fileName={openedFile.fileName}
                snippet={openedFile.snippet}
                initialPosition={{ x: initialPosition.x + offsetX, y: initialPosition.y + offsetY }}
                initialSize={{ width: 400, height: 300 }}
                onClose={() => handleCloseFile(openedFile.id)}
                onClick={() => {}}
                shouldBlink={false}
              />
            )}
            {openedFile.type === '.odt' && (
              <Odt
                uuid={openedFile.id}
                fileName={openedFile.fileName}
                snippet={openedFile.snippet}
                initialPosition={{ x: initialPosition.x + offsetX, y: initialPosition.y + offsetY }}
                initialSize={{ width: 500, height: 350 }}
                onClose={() => handleCloseFile(openedFile.id)}
                onClick={() => {}}
                shouldBlink={false}
              />
            )}
            {openedFile.type === '.pdf' && (
              <Pdf
                uuid={openedFile.id}
                fileName={openedFile.fileName}
                snippet={openedFile.snippet}
                initialPosition={{ x: initialPosition.x + offsetX, y: initialPosition.y + offsetY }}
                initialSize={{ width: 520, height: 380 }}
                onClose={() => handleCloseFile(openedFile.id)}
                onClick={() => {}}
                shouldBlink={false}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

export default Files