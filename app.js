// Элементы DOM
const buyButton = document.getElementById('buyButton');
const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modalMessage');

// Проверка Telegram WebApp
if (!window.Telegram || !window.Telegram.WebApp) {
  alert('Ошибка: Telegram WebApp не инициализирован');
} else {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();

  // Инициализация localStorage для истории покупок
  const purchaseHistory = JSON.parse(localStorage.getItem('friesPurchases')) || { count: 0 };

  // Обновление текста кнопки
  function updateButtonText() {
    buyButton.textContent = purchaseHistory.count > 0 ? 'Купить ещё' : 'Купить за 1 ★';
    buyButton.classList.add('animate__pulse');
  }
  updateButtonText();

  // Показ модального окна с анимацией
  function showModal(message) {
    modalMessage.textContent = message;
    modal.style.display = 'flex';
    modal.classList.add('animate__fadeIn');
    setTimeout(() => {
      modal.classList.remove('animate__fadeIn');
      modal.classList.add('animate__fadeOut');
      setTimeout(() => (modal.style.display = 'none'), 500);
    }, 2000);
  }

  // Обработка ошибок
  function showError(message) {
    showModal(`Ошибка: ${message} 😔`);
    buyButton.disabled = false; // Разблокируем кнопку
  }

  // Обработчик кнопки покупки
  buyButton.addEventListener('click', () => {
    buyButton.classList.add('animate__bounce');
    buyButton.disabled = true; // Блокируем кнопку

    // Настройка платежа через Telegram Stars (инвойс)
    tg.showPopup({
      title: 'Покупка картошки фри',
      message: 'Вы получите виртуальную картошку фри за 1 звезду! Это шутка, звезда вернётся сразу после оплаты 😄',
      buttons: [{ id: 'pay', type: 'default', text: 'Оплатить' }]
    }, (buttonId) => {
      if (buttonId === 'pay') {
        // Используем Telegram Stars через инвойс
        tg.invokeCustomMethod('createInvoice', {
          currency: 'XTR', // Код для Telegram Stars
          prices: [{ label: 'Виртуальная картошка фри 🍟', amount: 1 }],
          need_shipping_address: false,
          is_flexible: false,
       , (error, result) => {
          if (error) {
            showError('Не удалось создать инвойс');
            return;
          }

          // Показываем окно оплаты
          tg.openInvoice(result.invoice_link, (status) => {
            if (status === 'paid') {
              // Успешная оплата
              purchaseHistory.count += 1;
              localStorage.setItem('friesPurchases', JSON.stringify(purchaseHistory));

              // Показываем сообщение об успехе
              showModal('Успешно! Виртуальная картошка фри добавлена в вашу коллекцию 🍟');

              // Возвращаем звезду (рефанд)
              tg.invokeCustomMethod('refundPayment', {
                invoice_id: result.invoice_id,
                amount: 1,
              }, (refundError) => {
                if (refundError) {
                  showError('Не удалось вернуть звезду');
                }
              });

              // Обновляем кнопку
              updateButtonText();
            } else if (status === 'cancelled') {
              showError('Платёж отменён');
            } else {
              showError('Платёж не прошёл');
            }
            buyButton.disabled = false; // Разблокируем кнопку
          });
        });
      } else {
        buyButton.disabled = false; // Разблокируем кнопку, если пользователь отменил
      }
    });
  });
}