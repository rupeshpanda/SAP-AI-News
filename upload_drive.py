import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

def upload_basic(filename="download.jpeg", mimetype="image/jpeg"):
    """
    Uploads a file to Google Drive.
    Loads pre-authorized user credentials from the local environment.
    """
    # Load default credentials from environment (Application Default Credentials - ADC)
    creds, _ = google.auth.default()

    try:
        # Create Google Drive API v3 client
        service = build("drive", "v3", credentials=creds)

        file_metadata = {"name": filename}
        media = MediaFileUpload(filename, mimetype=mimetype)
        
        file = (
            service.files()
            .create(body=file_metadata, media_body=media, fields="id")
            .execute()
        )
        print(f"File uploaded successfully. File ID: {file.get('id')}")
        return file.get("id")

    except HttpError as error:
        print(f"An API error occurred: {error}")
        return None

if __name__ == "__main__":
    # Example execution (expects 'download.jpeg' to exist locally)
    upload_basic("download.jpeg", "image/jpeg")
