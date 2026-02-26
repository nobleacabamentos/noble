// mock-payment-server.js
// Um servidor simples para simular a função do Supabase sem precisar de Docker!

const http = require('http');
const { URL } = require('url');

// --- CONFIGURAÇÃO ---
const MP_ACCESS_TOKEN = "APP_USR-3696569642041372-022516-71b40305a7f30405427b99b8c43ee937-161939691";
const SUPABASE_URL = "https://xpoktmqxmgduginmqojf.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwb2t0bXF4bWdkdWdpbm1xb2pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4NTI4MywiZXhwIjoyMDg3MzYxMjgzfQ.33gs-0vC7pahR5Jg1eO_3uponlzmBp2OiVMwPdEnM0E";
const STORE_ORIGIN_CEP = "88845000";

// --- MODO SANDBOX (TESTE) ---
const USE_SANDBOX = true;
const SANDBOX_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI4YjJjZjU4MzA1MGNjMzhkZjlmNzRmOTE5NTgxMTYzZGJkNmVjMDlhZDdiNGI4NDVmNjY1ZWMzZjBmNTRkODVhNTFkYTMyOWFkZTI4YmUyZCIsImlhdCI6MTc3MjA1Mzc4MS4wMzU3OTQsIm5iZiI6MTc3MjA1Mzc4MS4wMzU3OTYsImV4cCI6MTgwMzU4OTc4MS4wMjYzNTgsInN1YiI6ImExMmFkNmRhLTk2MmEtNDRhNS04OTA1LWIwNWU3Y2Q1ZWM1MCIsInNjb3BlcyI6WyJjYXJ0LXJlYWQiLCJjYXJ0LXdyaXRlIiwiY29tcGFuaWVzLXJlYWQiLCJjb21wYW5pZXMtd3JpdGUiLCJjb3Vwb25zLXJlYWQiLCJjb3Vwb25zLXdyaXRlIiwibm90aWZpY2F0aW9ucy1yZWFkIiwib3JkZXJzLXJlYWQiLCJwcm9kdWN0cy1yZWFkIiwicHJvZHVjdHMtZGVzdHJveSIsInByb2R1Y3RzLXdyaXRlIiwicHVyY2hhc2VzLXJlYWQiLCJzaGlwcGluZy1jYWxjdWxhdGUiLCJzaGlwcGluZy1jYW5jZWwiLCJzaGlwcGluZy1jaGVja291dCIsInNoaXBwaW5nLWNvbXBhbmllcyIsInNoaXBwaW5nLWdlbmVyYXRlIiwic2hpcHBpbmctcHJldmlldyIsInNoaXBwaW5nLXByaW50Iiwic2hpcHBpbmctc2hhcmUiLCJzaGlwcGluZy10cmFja2luZyIsImVjb21tZXJjZS1zaGlwcGluZyIsInRyYW5zYWN0aW9ucy1yZWFkIiwidXNlcnMtcmVhZCIsInVzZXJzLXdyaXRlIiwid2ViaG9va3MtcmVhZCIsIndlYmhvb2tzLXdyaXRlIiwid2ViaG9va3MtZGVsZXRlIiwidGRlYWxlci13ZWJob29rIl19.uqdkhKwITdP_H1vhxLLCPaGu1Fw5fGFMXp8YltrHUutAyFxx8-Q7HucIqjOUYxRKAte0rEwbyKZMpCXJ3FEviELY0_YqB-CLYKoECtn9O8YH1gVWrY-euqncpjTKILIWypTbWLN8vk8dWJlzBqwW0qqM9Dh1TfV3u7mzzo9rYNcuxLwGn_InnkedsnOWHTqUuawK8JtdEpp1SoA8tfZHJ2m7dmLzw79bx-mmaWdHzFlGg_gvn6G-nsi8bJQT3-CEdM4HNeyO49pXlaLYLJnEVhNwe7jlZGndNpNQdGPqbouM7GAEp37ireEkl4FR-uT2aH6BZASFAdx8ri4x0mJcNH9krkkpimqktJCBtMin5zVdUgU2NZ4DmeWwp4SH-Wd4T6y2C-sLguL8lYdOfoIzqiyt9jn6tRA3nkG6XJsG6ajwsUBV8mFncIYDOu0JFp_2qt1na887O-JRV-t9WHe3_zULCPvq8ZfqyvWpAFjnNeZtthxdI32Z4GjdlGFTjcYbHGJTbesAu6j_YF5rF7juFGIOtRFVFaxwDdScrak3drTJ6hqc4OA-Deb4TEb6q4Tc_3rMSdRGeb1a0t2tlCmYBba_xT8_FQEKpVi955FGz-3ojNgWJ2XMVX2VEhx7yZeOP0MF0PSg6q-vtb5oTszhVF5vVgYpukPAsB6KYmTBpGg";
const PRODUCAO_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMzM5MzM1OWM2NzNiNGE0NTc0ODk0NzRmYTkyZTNhMGVhMWJiZjgyZGEzYmEzZDM2MDcwOTI3MzViYmFjMTQ1NzJkMWJmOTg2MzU1ZTE4MzgiLCJpYXQiOjE3NzE5NzcyODEuNjk5ODg1LCJuYmYiOjE3NzE5NzcyODEuNjk5ODg2LCJleHAiOjE4MDM1MTMyODEuNjg2NTA4LCJzdWIiOiJkMDE0ZDE2ZS01ZjQwLTQ1YTAtOWZhYy0zZTkxMTU0MTQ1MzQiLCJzY29wZXMiOlsiY2FydC1yZWFkIiwiY2FydC13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiY29tcGFuaWVzLXdyaXRlIiwiY291cG9ucy1yZWFkIiwiY291cG9ucy13cml0ZSIsIm5vdGlmaWNhdGlvbnMtcmVhZCIsIm9yZGVycy1yZWFkIiwicHJvZHVjdHMtcmVhZCIsInByb2R1Y3RzLWRlc3Ryb3kiLCJwcm9kdWN0cy13cml0ZSIsInByb2R1Y3RzLXJlYWQiLCJwdXJjaGFzZXMtcmVhZCIsInNoaXBwaW5nLWNhbGN1bGF0ZSIsInNoaXBwaW5nLWNhbmNlbCIsInNoaXBwaW5nLWNoZWNrb3V0Iiwic2hpcHBpbmctY29tcGFuaWVzIiwic2hpcHBpbmctZ2VuZXJhdGUiLCJzaGlwcGluZy1wcmV2aWV3Iiwic2hpcHBpbmctcHJpbnQiLCJzaGlwcGluZy1zaGFyZSIsInNoaXBwaW5nLXRyYWNraW5nIiwiZWNvbW1lcmNlLXNoaXBwaW5nIiwidHJhbnNhY3Rpb25zLXJlYWQiLCJ1c2Vycy1yZWFkIiwidXNlcnMtd3JpdGUiLCJ3ZWJob29rcy1yZWFkIiwid2ViaG9va3Mtd3JpdGUiLCJ3ZWJob29rcy1kZWxldGUiLCJ0ZGVhbGVyLXdlYmhvb2siXX0.Kc5qEPubXCOY1TUNEURghwi41h_sKhBkICqrpdqBa92J4no0vTiPFqw-CBGF7HkMIa_s7jJy046y7JIsM_nuTEdM6jZq8z6IGdfwvGrHs9JDm-dp5_irqHB4_Sem_Hh-Hfx_rZg5AC6cSZZjJzP0DX5rXE-KnaQC2hQi1Lxk-MY4VFg-YwrBz1oZJNDzMbu_QKwF0qgJWAndmz3Fa7jNCu-46qbJzYpg6Kvhlu6aA3MKt7kKYoNGluU7lUKkULfz7SuGfxX7aRB7qLFJuh3Maw19-oHBSQ72Xh3g-6TclMhGdOD6gS3KWofBdHNWGYcmiFSjTGpqZEfLUE-AW-JuTYt_hkp1cvha_UKtcD6IVi5tE9EIkY1tlD2MUTkQG7bE_9tgwqak9e-akgbwXrwhmvSOWfkmb_FMj1Tbrwgh5EKU3VD0JsH7_WKZ1rSqXO_dF7jvEdkOinCE5cnaUwrlTlGK70X6wZw_MHhB-K7TPTcVUaELBChT5z1QKyj3DcXYjjS31saxCAYfQYdONElHQ6hVtL9_sNdUnyhh8CYey2bL6v8hYBT_dBpShv17I9h3F2Aft_mGs6T8hvMOA4Mm54jiJFKpkmEZLsycTpXU-gnEuSTrg4uy9QmZkJikyCjfWz-1GkC2X_DJqGkPEMZZWdfscK1_5lKJM610cmLhtXs";

const ME_TOKEN = USE_SANDBOX ? SANDBOX_TOKEN : PRODUCAO_TOKEN;
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
