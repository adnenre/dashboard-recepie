// Appwrite client kept in this file name for backwards-compatible imports.
import { Client, Databases } from 'appwrite'

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? ''
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? ''

export const appwriteConfigured = Boolean(endpoint && projectId)
export const appwriteClient = new Client()
if (appwriteConfigured) appwriteClient.setEndpoint(endpoint).setProject(projectId)
export const databases = new Databases(appwriteClient)
export const appwriteDatabaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? 'recipes'
export const appwriteCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID ?? 'recipes'
