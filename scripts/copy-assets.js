const fs = require('fs');
const path = require('path');

// Función para crear directorios recursivamente
function mkdirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) return;
  
  const parentDir = path.dirname(dirPath);
  if (!fs.existsSync(parentDir)) {
    mkdirRecursive(parentDir);
  }
  fs.mkdirSync(dirPath);
}

// Función para copiar archivos recursivamente
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    });
  } else {
    // Asegurar que el directorio destino existe
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      mkdirRecursive(destDir);
    }
    
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log('🔄 Copiando assets...');
  
  // Crear directorio dist/utils/assets si no existe
  const assetsDestDir = path.join(__dirname, '..', 'dist', 'utils', 'assets');
  mkdirRecursive(assetsDestDir);
  
  // Copiar templates
  const templatesSrc = path.join(__dirname, '..', 'src', 'templates');
  const templatesDest = path.join(__dirname, '..', 'dist', 'templates');
  if (fs.existsSync(templatesSrc)) {
    copyRecursive(templatesSrc, templatesDest);
    console.log('✅ Templates copiados correctamente');
  } else {
    console.log('⚠️  Carpeta templates no encontrada');
  }
  
  // Copiar assets
  const assetsSrc = path.join(__dirname, '..', 'src', 'utils', 'assets');
  if (fs.existsSync(assetsSrc)) {
    copyRecursive(assetsSrc, assetsDestDir);
    console.log('✅ Assets copiados correctamente');
  } else {
    console.log('⚠️  Carpeta assets no encontrada');
  }
  
  console.log('🎉 Proceso de copia completado');
} catch (error) {
  console.error('❌ Error copiando assets:', error.message);
  process.exit(1);
}
