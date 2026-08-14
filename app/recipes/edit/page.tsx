import { RecipeEditorPage } from '@/components/recipe-editor-page'

export default async function EditRecipePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams
  return <RecipeEditorPage mode="edit" recipeId={params.id ?? ''} />
}
