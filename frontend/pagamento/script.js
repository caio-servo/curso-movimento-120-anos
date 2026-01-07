const form = document.getElementById('paymentForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        cpfCnpj: document.getElementById('cpfCnpj').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        value: 99.90
    };

    try {
        const response = await fetch('https://seu-backend.com/api/payments/asaas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao processar pagamento');
        }

        if (data.invoiceUrl) {
            window.location.href = data.invoiceUrl; // boleto ou cartão
        }

        if (data.pixQrCode) {
            alert('Pagamento PIX gerado com sucesso');
            console.log(data.pixQrCode);
        }

    } catch (err) {
        alert(err.message);
    }
});

