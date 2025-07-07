fetch('https://api.replicate.com')
  .then(res => res.text())
  .then(text => console.log('Ответ:', text))
  .catch(err => console.error('Ошибка fetch:', err));