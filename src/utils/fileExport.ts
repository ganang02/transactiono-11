
import { toast } from "@/hooks/use-toast";
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Check if we're running on a mobile device
const isMobileDevice = () => {
  return typeof (window as any).Capacitor !== 'undefined';
};

export async function saveFile(fileName: string, data: string, mimeType: string) {
  try {
    if (isMobileDevice()) {
      // Use Capacitor Filesystem API for mobile devices
      const result = await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      
      // Also try to make the file available in the gallery for easier access
      try {
        await Filesystem.getUri({
          path: fileName,
          directory: Directory.Documents
        });
      } catch (e) {
        console.log("Could not get file URI, but file was saved", e);
      }
      
      toast({
        title: "File tersimpan",
        description: `File disimpan di folder Documents dengan nama ${fileName}`,
      });
      
      return true;
    } else {
      // Use browser download for desktop (simplified approach)
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    }
  } catch (error) {
    console.error("File save error:", error);
    toast({
      title: "Ekspor gagal",
      description: "Terjadi kesalahan saat mengekspor data. Pastikan aplikasi memiliki izin penyimpanan.",
      variant: "destructive"
    });
    return false;
  }
}

// Read a file from the device storage
export async function readFile(path: string, directory = Directory.Documents): Promise<string | null> {
  try {
    if (!isMobileDevice()) {
      console.warn("Reading files is only supported on mobile devices");
      return null;
    }
    
    const result = await Filesystem.readFile({
      path: path,
      directory: directory,
      encoding: Encoding.UTF8
    });
    
    return result.data as string; // Fix for the first error - explicitly cast to string
  } catch (error) {
    console.error("File read error:", error);
    toast({
      title: "Pembacaan file gagal",
      description: "Terjadi kesalahan saat membaca file",
      variant: "destructive"
    });
    return null;
  }
}

// List files in a directory
export async function listFiles(directory = Directory.Documents): Promise<string[]> {
  try {
    if (!isMobileDevice()) {
      console.warn("Listing files is only supported on mobile devices");
      return [];
    }
    
    const result = await Filesystem.readdir({
      path: '',
      directory: directory
    });
    
    return result.files.map(file => file.name);
  } catch (error) {
    console.error("List files error:", error);
    toast({
      title: "Pembacaan direktori gagal",
      description: "Terjadi kesalahan saat mengakses direktori",
      variant: "destructive"
    });
    return [];
  }
}

// Process numerical values for CSV export
export function processNumberForCSV(value: number | string | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0";
  }
  
  // Ensure it's a number and convert to string
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : Number(value);
  return numValue.toString();
}

// Save a remote image to local file system
export async function saveRemoteImage(imageUrl: string, fileName: string): Promise<string | null> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Convert blob to base64
    const reader = new FileReader();
    return new Promise<string | null>((resolve, reject) => {
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        if (isMobileDevice()) {
          // Save image using Filesystem API
          try {
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64String.split(',')[1], // Remove the data URL prefix
              directory: Directory.Documents,
              encoding: Encoding.UTF8 // Fix for the second error - use UTF8 instead of BASE64
            });
            
            toast({
              title: "Gambar tersimpan",
              description: `Gambar disimpan di folder Documents dengan nama ${fileName}`,
            });
            
            return resolve(savedFile.uri || null);
          } catch (error) {
            console.error("Failed to save image to filesystem:", error);
            return resolve(null);
          }
        } else {
          // For desktop, just return the base64 string
          resolve(base64String);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error saving remote image:", error);
    return null;
  }
}
