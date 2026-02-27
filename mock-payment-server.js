// mock-payment-server.js
// Um servidor simples para simular a função do Supabase sem precisar de Docker!

const http = require('http');
const { URL } = require('url');
require('dotenv').config();

// --- CONFIGURAÇÃO ---
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORE_ORIGIN_CEP = process.env.STORE_ORIGIN_CEP || "88845000";

// --- MODO SANDBOX (TESTE) ---
const USE_SANDBOX = true;
const ME_TOKEN = USE_SANDBOX ? process.env.ME_TOKEN : process.env.ME_TOKEN_PRODUCAO;
const ME_URL = USE_SANDBOX ? "https://sandbox.melhorenvio.com.br" : "https://www.melhorenvio.com.br";
const PORT = 54322;

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    console.log(`[${req.method}] ${req.url}`);

    if (req.method === 'POST' && req.url.includes('/mercadopago-checkout')) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { items } = JSON.parse(body);
                const mpItems = items.map(item => ({
                    id: item.id,
                    title: item.name,
                    unit_price: Number(item.price),
                    quantity: Number(item.quantity),
                    currency_id: 'BRL',
                }));
                const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: mpItems,
                        back_urls: {
                            success: `http://127.0.0.1:5500/loja.html?status=success`,
                            failure: `http://127.0.0.1:5500/loja.html?status=failure`,
                            pending: `http://127.0.0.1:5500/loja.html?status=pending`,
                        },
                    }),
                });
                const preference = await mpRes.json();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ checkoutUrl: preference.init_point }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    }

    else if (req.method === 'POST' && req.url.includes('/melhorenvio-calculate')) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { zip, items } = JSON.parse(body);
                const productIds = items.map(i => i.id);
                const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=in.(${productIds.join(',')})`, {
                    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
                });
                const dbProducts = await supabaseRes.json();

                // Nova Lógica: Fracionamento Inteligente em Volumes de até 30kg
                const splitIntoVolumes = (items, dbProducts) => {
                    const volumes = [];
                    const MAX_WEIGHT_G = 30000; // 30kg por volume/etiqueta

                    items.forEach(item => {
                        const dbP = dbProducts.find(p => String(p.id) === String(item.id)) || {};
                        const qty = Number(item.quantity) || 1;

                        // Pegar dados reais do banco ou usar fallbacks seguros
                        const unitW = dbP.weight_g || 1000;
                        const unitL = dbP.length_cm || 50;
                        const unitWi = dbP.width_cm || 20;
                        const unitH = dbP.height_cm || 15;

                        // Quantas unidades cabem em um volume de 30kg?
                        const unitsPerBucket = Math.floor(MAX_WEIGHT_G / unitW) || 1;

                        let remainingQty = qty;
                        while (remainingQty > 0) {
                            const currentQty = Math.min(remainingQty, unitsPerBucket);

                            // Lógica de Empilhamento em Grade (Comprimento Fixo)
                            // Tentamos fazer uma base quadrada (ou retangular próxima)
                            const widthCount = Math.ceil(Math.sqrt(currentQty));
                            const heightCount = Math.ceil(currentQty / widthCount);

                            const finalWidth = unitWi * widthCount;
                            const finalHeight = unitH * heightCount;
                            const totalWeight = (unitW * currentQty) / 1000;

                            volumes.push({
                                id: `${item.id}_vol_${volumes.length}`,
                                width: finalWidth,
                                height: finalHeight,
                                length: unitL,
                                weight: totalWeight,
                                insurance_value: Number(item.price) * currentQty,
                                quantity: 1 // Sempre 1 volume por entrada na lista do Melhor Envio
                            });

                            remainingQty -= currentQty;
                        }
                    });
                    return volumes;
                };

                const mappedProducts = splitIntoVolumes(items, dbProducts);
                console.log(`[LOG FRETE] Pedido fracionado em ${mappedProducts.length} volumes.`);
                mappedProducts.forEach((v, i) => {
                    console.log(` -> Volume ${i + 1}: ${v.weight}kg | ${v.width}x${v.height}x${v.length}cm`);
                });

                const meRes = await fetch(`${ME_URL}/api/v2/me/shipment/calculate`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${ME_TOKEN}`, 'User-Agent': 'NobleAcabamentos' },
                    body: JSON.stringify({ from: { postal_code: STORE_ORIGIN_CEP }, to: { postal_code: zip }, products: mappedProducts })
                });
                const meData = await meRes.json();
                const options = meData
                    .filter(opt => !opt.error && !opt.name.toLowerCase().includes('centralizado'))
                    .map(opt => ({ id: opt.id, name: opt.name, price: opt.price, delivery_time: opt.delivery_time, company: { name: opt.company.name, picture: opt.company.picture } }));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ options, debug: mappedProducts }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }

    else if (req.method === 'POST' && req.url.includes('/melhorenvio-label')) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { order_id } = JSON.parse(body);
                const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}&select=*,order_items(*),profiles(*)`, {
                    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
                });
                const [order] = await orderRes.json();
                const receiver = order.profiles;
                const dbProductsRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=in.(${order.order_items.map(i => i.product_id).join(',')})`, {
                    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
                });
                const dbProducts = await dbProductsRes.json();

                // Nova Lógica: Fracionamento Inteligente para Geração de Etiqueta
                const splitIntoVolumes = (orderItems, dbProducts) => {
                    const volumes = [];
                    const MAX_WEIGHT_G = 30000;

                    orderItems.forEach(item => {
                        const dbP = dbProducts.find(p => String(p.id) === String(item.product_id)) || {};
                        const qty = Number(item.quantity) || 1;

                        const unitW = dbP.weight_g || 1000;
                        const unitL = dbP.length_cm || 50;
                        const unitWi = dbP.width_cm || 20;
                        const unitH = dbP.height_cm || 15;

                        const unitsPerBucket = Math.floor(MAX_WEIGHT_G / unitW) || 1;

                        let remainingQty = qty;
                        while (remainingQty > 0) {
                            const currentQty = Math.min(remainingQty, unitsPerBucket);
                            const widthCount = Math.ceil(Math.sqrt(currentQty));
                            const heightCount = Math.ceil(currentQty / widthCount);

                            volumes.push({
                                width: Math.max(15, unitWi * widthCount),
                                height: Math.max(2, unitH * heightCount),
                                length: Math.max(15, unitL),
                                weight: Math.max(0.1, (unitW * currentQty) / 1000)
                            });
                            remainingQty -= currentQty;
                        }
                    });
                    return volumes;
                };

                const finalVolumes = splitIntoVolumes(order.order_items, dbProducts);
                console.log(`[LOG ETIQUETA] Gerando ${finalVolumes.length} volumes para o pedido ${order_id}.`);

                // Limite de seguro para envios não comerciais (sem NF) é R$ 1.000,00
                const calculatedInsurance = Number(order.total_amount) - Number(order.shipping_cost);
                const cappedInsurance = Math.min(calculatedInsurance, 1000);

                const cartPayload = {
                    service: order.shipping_method_id,
                    from: { name: "Noble Acabamentos", phone: "48988799001", email: "contato@nobleacabamentos.com.br", document: USE_SANDBOX ? "86689703991" : "32514476000137", company_document: "32514476000137", address: "Rua Zelcy Burigo", number: "658", district: "Jardim Itália", city: "Cocal do Sul", state_abbr: "SC", postal_code: STORE_ORIGIN_CEP },
                    to: { name: receiver.full_name || "Cliente", phone: (receiver.phone || "").replace(/\D/g, ''), email: receiver.email || "email@naoinformado.com", document: (receiver.cpf_cnpj || "").replace(/\D/g, ''), address: receiver.logradouro, number: receiver.numero, complement: receiver.complemento || "", district: receiver.bairro, city: receiver.cidade, state_abbr: receiver.uf, postal_code: (receiver.cep || "").replace(/\D/g, '') },
                    products: order.order_items.map(i => ({ name: i.name, quantity: i.quantity, unitary_value: Number(i.price) })),
                    volumes: finalVolumes,
                    options: { insurance_value: cappedInsurance, receipt: false, own_hand: false }
                };

                // ME API Calls - Verbose Logging
                console.log("Step A: Adding to Cart...");
                const cartRes = await fetch(`${ME_URL}/api/v2/me/cart`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ME_TOKEN}`,
                        'User-Agent': 'NobleAcabamentos'
                    },
                    body: JSON.stringify(cartPayload)
                });
                const cartData = await cartRes.json();
                console.log("Cart Response:", JSON.stringify(cartData, null, 2));

                if (!cartRes.ok) throw new Error(cartData.message || "Erro no Carrinho ME");
                const shipId = cartData.id;

                console.log("Step B: Checkout (Payment)...");
                const checkoutRes = await fetch(`${ME_URL}/api/v2/me/shipment/checkout`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ME_TOKEN}`
                    },
                    body: JSON.stringify({ orders: [shipId] })
                });
                const checkoutData = await checkoutRes.json();
                console.log("Checkout Response:", JSON.stringify(checkoutData, null, 2));
                if (!checkoutRes.ok) throw new Error(checkoutData.message || "Erro no Checkout ME");

                console.log("Step C: Generating Label...");
                const genRes = await fetch(`${ME_URL}/api/v2/me/shipment/generate`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ME_TOKEN}`
                    },
                    body: JSON.stringify({ orders: [shipId] })
                });
                const genData = await genRes.json();
                console.log("Generate Response:", JSON.stringify(genData, null, 2));

                console.log("Step D: Printing Label...");
                const printRes = await fetch(`${ME_URL}/api/v2/me/shipment/print`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${ME_TOKEN}`
                    },
                    body: JSON.stringify({ mode: 'pdf', orders: [shipId] })
                });
                const printData = await printRes.json();
                console.log("Print Response:", JSON.stringify(printData, null, 2));

                const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'enviado', label_url: printData.url || null })
                });

                if (updateRes.ok) {
                    console.log(`✅ [SUPABASE] Pedido ${order_id} atualizado com label_url.`);
                } else {
                    const errTxt = await updateRes.text();
                    console.error(`❌ [SUPABASE] Falha ao atualizar pedido: ${errTxt}`);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, labelUrl: printData.url || null }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor de Teste rodando em http://localhost:${PORT}`);
});
