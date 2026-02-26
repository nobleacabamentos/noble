const SUPABASE_URL = 'https://xpoktmqxmgduginmqojf.supabase.co/rest/v1/products';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb2t0bXF4bWdkdWdpbm1xb2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4NTI4MywiZXhwIjoyMDg3MzYxMjgzfQ.33gs-0vC7pahR5Jg1eO_3uponlzmBp2OiVMwPdEnM0E';

const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

async function run() {
    console.log("Deletando conexao antigas...");
    const delRes = await fetch(`${SUPABASE_URL}?category=eq.conexao`, {
        method: 'DELETE',
        headers
    });

    if (!delRes.ok) {
        console.error("Erro ao deletar:", await delRes.text());
        return;
    }
    console.log("Deletado com sucesso.");

    const brands = ['Cejatel Telhas', 'Karina Telhas', 'Vilhena Grês', 'Temax Telhas', 'Tettogres'];
    const colors = ['vinho', 'grafite', 'branco', 'caramelo', 'marfim', 'cinza'];

    const typesToGenerate = [
        { name: 'Conexão 3 Vias (3 Peças)', category: 'conexao', prefix: 'terminal3vias', type_id: 'c3v', price: 144.00, descPrefix: 'Caixa com 3 Peças', specs: { w: 4500, l: 39, wi: 31, h: 35, text: 'Peso: 4,5 kg | Dimensões: 31x35x39cm' } },
        { name: 'Conexão 3 Vias (6 Peças)', category: 'conexao', prefix: 'terminal3vias', type_id: 'c6v', price: 144.00, descPrefix: 'Caixa com 6 Peças', specs: { w: 9000, l: 30, wi: 57, h: 35, text: 'Peso: 9 kg | Dimensões: 57x30x35cm' } }
    ];

    const productsToInsert = [];
    brands.forEach(brand => {
        colors.forEach(color => {
            typesToGenerate.forEach(typeInfo => {
                let fileNameColor = color;
                const capitalizedColor = color.charAt(0).toUpperCase() + color.slice(1);
                productsToInsert.push({
                    name: `${typeInfo.name} - ${capitalizedColor}`,
                    brand: brand,
                    color: color,
                    category: typeInfo.category,
                    price: typeInfo.price,
                    weight_g: typeInfo.specs.w,
                    length_cm: typeInfo.specs.l,
                    width_cm: typeInfo.specs.wi,
                    height_cm: typeInfo.specs.h,
                    image_url: `assets/produtos/${typeInfo.prefix}_${fileNameColor}.jpg`,
                    description: `${typeInfo.descPrefix}. ${typeInfo.name} da marca ${brand} na cor ${color}. ${typeInfo.specs.text}.`
                });
            });
        });
    });

    console.log(`Inserindo ${productsToInsert.length} novos produtos...`);
    const insRes = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(productsToInsert)
    });

    if (!insRes.ok) {
        console.error("Erro ao inserir:", await insRes.text());
    } else {
        console.log("Sucesso!");
    }
}

run();
