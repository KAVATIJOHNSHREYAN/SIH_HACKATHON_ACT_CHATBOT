export const uploadFileMultipart = (file: File, onProgress: (pct: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.fileUrl) {
            resolve(res.fileUrl);
          } else {
            reject(new Error(res.error || "Upload failed without a file URL."));
          }
        } catch (err) {
          reject(new Error("Failed to parse upload response."));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
};
