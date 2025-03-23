
import { toast } from "@/hooks/use-toast";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useMobile } from "@/hooks/use-mobile";

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
        encoding: 'utf8',
      });
      
      toast({
        title: "File tersimpan",
        description: `File disimpan di ${result.uri || 'folder Documents'}`,
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
      description: "Terjadi kesalahan saat mengekspor data",
      variant: "destructive"
    });
    return false;
  }
}

// Save a remote image to local file system (simplified version)
export async function saveRemoteImage(imageUrl: string, fileName: string): Promise<string | null> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Convert blob to base64
    const reader = new FileReader();
    return new Promise<string | null>((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error saving remote image:", error);
    return null;
  }
}
