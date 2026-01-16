document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('paymentForm');
  const methodSelect = document.getElementById('paymentMethod');
  const cardSection = document.getElementById('creditCardSection');

  if (!methodSelect || !cardSection) {
    console.error('Elementos não encontrados no DOM');
    return;
  }

  methodSelect.addEventListener('change', () => {
    cardSection.style.display =
      methodSelect.value === 'CREDIT_CARD'
        ? 'block'
        : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const method = methodSelect.value;

    const payload = {
      paymentMethod: method,
      value: 99.90, // 12x de 97
      name: name.value,
      email: email.value,
      cpfCnpj: cpfCnpj.value
    };

    if (method === 'CREDIT_CARD') {
      payload.card = {
        holderName: ccHolderName.value,
        number: ccNumber.value.replace(/\s/g, ''),
        expiryMonth: ccExpMonth.value,
        expiryYear: ccExpYear.value,
        ccv: ccCvv.value
      };
    }

    const res = await fetch('http://localhost:3000', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});


    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Erro no pagamento');
      return;
    }

    alert('Pagamento enviado com sucesso');
  });

});

