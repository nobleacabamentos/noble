const SUPABASE_URL = 'https://xpoktmqxmgduginmqojf.supabase.co/rest/v1/products';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb2t0bXF4bWdkdWdpbm1xb2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4NTI4MywiZXhwIjoyMDg3MzYxMjgzfQ.33gs-0vC7pahR5Jg1eO_3uponlzmBp2OiVMwPdEnM0E';

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
