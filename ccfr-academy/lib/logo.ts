// Endereço público do logotipo (pasta "logos" do Supabase, que é aberta para leitura)
export function publicLogo(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${path}`;
}
