import cloudinary from "cloudinary";

// Function to delete an image from Cloudinary using its public ID
const deleteImageFromCloudinary = async (publicId) => {
  console.log("publicId in deleteImageFromCloudinary",publicId);
  try {
    // Call the Cloudinary destroy method to delete the image by its public ID
    const result = await cloudinary.uploader.destroy(publicId);

    // Check if the image was successfully deleted
    if (result.result === "ok") {
      console.log(`Image with public ID ${publicId} deleted from Cloudinary`);
    } else {
      console.error(
        `Failed to delete image with public ID ${publicId} from Cloudinary`
      );
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error.message);
  }
};

export default deleteImageFromCloudinary;
