require('dotenv').config();
const SUPABASE_URL = process.env.SUPABASE_URL + '/rest/v1/products';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
};

async function checkTerminalData() {
    console.log("Consultando dados do Terminal de Cumeeira...");
    const res = await fetch(`${SUPABASE_URL}?name=ilike.Terminal de Cumeeira*&limit=1`, {
        method: 'GET',
        headers
    });
    const data = await res.json();
    if (data && data.length > 0) {
        const p = data[0];
        console.log(`Produto: ${p.name}`);
        console.log(`Peso (weight_g): ${p.weight_g}g`);
        console.log(`Altura (height_cm): ${p.height_cm}cm`);
        console.log(`Largura (width_cm): ${p.width_cm}cm`);
        console.log(`Comprimento (length_cm): ${p.length_cm}cm`);
        console.log(`Descrição: ${p.description}`);
    } else {
        console.log("Nenhum terminal encontrado.");
    }
}

checkTerminalData();
