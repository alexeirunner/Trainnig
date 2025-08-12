(function () {
  const { createElement: h, useState, useEffect } = React;

  function App() {
    const [count, setCount] = useState(0);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      setReady(true);
    }, []);

    return h('div', { className: 'container' }, [
      h('h1', { key: 'h1' }, 'Тренировочный сплит (PWA)'),
      h('p', { key: 'p1', className: 'muted' }, ready ? 'Готово к работе оффлайн.' : 'Загрузка…'),

      h('div', { key: 'controls', className: 'card' }, [
        h('p', { key: 'p2' }, `Счётчик повторений: ${count}`),
        h('div', { key: 'btns', className: 'row' }, [
          h('button', { key: 'b1', onClick: () => setCount(c => c + 1) }, ' +1 '),
          h('button', { key: 'b2', onClick: () => setCount(0) }, ' Сброс ')
        ])
      ]),

      h('details', { key: 'd1', className: 'card' }, [
        h('summary', null, 'Диагностика'),
        h('ul', { className: 'diag' }, [
          h('li', { key: 'l1' }, `Service Worker: ${'serviceWorker' in navigator}`),
          h('li', { key: 'l2' }, `Manifest: подключён (см. <head>)`),
          h('li', { key: 'l3' }, `Кэш: ${'caches' in window}`)
        ])
      ])
    ]);
  }

  const root = document.getElementById('root');
  ReactDOM.createRoot(root).render(h(App));
})();
