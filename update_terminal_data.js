const SUPABASE_URL = 'https://xpoktmqxmgduginmqojf.supabase.co/rest/v1/products';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb2t0bXF4bWdkdWdpbm1xb2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4NTI4MywiZXhwIjoyMDg3MzYxMjgzfQ.33gs-0vC7pahR5Jg1eO_3uponlzmBp2OiVMwPdEnM0E';

const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
};

async function updateTerminalSpecs() {
    console.log("Atualizando Terminais de Cumeeira no banco de dados...");

    // Buscar todos os terminais
    const res = await fetch(`${SUPABASE_URL}?name=ilike.Terminal de Cumeeira*`, {
        headers
    });
    const products = await res.json();

    console.log(`Encontrados ${products.length} terminais. Iniciando atualização...`);

    for (const p of products) {
        // Nova descrição conforme a solicitação do usuário
        const newDescription = `Caixa com 12 Unidades. Terminal de Cumeeira na cor ${p.color}. Produzido pela ${p.brand}. Peso: 5 kg | Dimensões: 20x15x50cm. Garantia de qualidade.`;

        const updateRes = await fetch(`${SUPABASE_URL}?id=eq.${p.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                weight_g: 5000,
                height_cm: 15,
                width_cm: 20,
                length_cm: 50,
                description: newDescription
            })
        });

        if (!updateRes.ok) {
            console.error(`Erro ao atualizar ID ${p.id}:`, await updateRes.text());
        }
    }

    console.log("Atualização concluída.");
}

updateTerminalSpecs();
