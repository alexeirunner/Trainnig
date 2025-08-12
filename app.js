(function () {
  const { createElement: h, useState, useEffect } = React;

  const STORAGE_KEY = 'trainnig_full_plan_v1';

  const SPLIT_TEMPLATES = {
    'PPL': [
      { day: 'Push', exercises: ['Жим лёжа', 'Жим стоя', 'Разведения гантелей'] },
      { day: 'Pull', exercises: ['Тяга штанги', 'Подтягивания', 'Тяга верхнего блока'] },
      { day: 'Legs', exercises: ['Приседания', 'Жим ногами', 'Румынская тяга'] }
    ],
    'FBW': [
      { day: 'Full Body', exercises: ['Жим лёжа', 'Тяга штанги', 'Приседания', 'Подтягивания'] }
    ],
    'Upper/Lower': [
      { day: 'Upper', exercises: ['Жим лёжа', 'Тяга штанги', 'Жим стоя', 'Подтягивания'] },
      { day: 'Lower', exercises: ['Приседания', 'Жим ногами', 'Румынская тяга'] }
    ]
  };

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function App() {
    const [page, setPage] = useState('settings');
    const [template, setTemplate] = useState('PPL');
    const [progressionType, setProgressionType] = useState('kg'); // 'kg' or '%'
    const [progressionStep, setProgressionStep] = useState(2.5);
    const [weeks, setWeeks] = useState(4);
    const [plan, setPlan] = useState([]);

    useEffect(() => {
      const saved = loadData();
      if (saved) {
        setPage(saved.page || 'settings');
        setTemplate(saved.template);
        setProgressionType(saved.progressionType);
        setProgressionStep(saved.progressionStep);
        setWeeks(saved.weeks);
        setPlan(saved.plan);
      } else {
        loadTemplate('PPL');
      }
    }, []);

    useEffect(() => {
      saveData({ page, template, progressionType, progressionStep, weeks, plan });
    }, [page, template, progressionType, progressionStep, weeks, plan]);

    function loadTemplate(name) {
      setTemplate(name);
      setPlan(
        SPLIT_TEMPLATES[name].map(d => ({
          day: d.day,
          exercises: d.exercises.map(ex => ({
            name: ex,
            oneRM: 100,
            sets: [{ percent: 70 }, { percent: 75 }, { percent: 80 }]
          }))
        }))
      );
    }

    function updateExercise(dayIdx, exIdx, field, value) {
      setPlan(p =>
        p.map((d, i) =>
          i === dayIdx
            ? {
                ...d,
                exercises: d.exercises.map((e, j) =>
                  j === exIdx ? { ...e, [field]: value } : e
                )
              }
            : d
        )
      );
    }

    function updateSet(dayIdx, exIdx, setIdx, field, value) {
      setPlan(p =>
        p.map((d, i) =>
          i === dayIdx
            ? {
                ...d,
                exercises: d.exercises.map((e, j) =>
                  j === exIdx
                    ? {
                        ...e,
                        sets: e.sets.map((s, k) =>
                          k === setIdx ? { ...s, [field]: value } : s
                        )
                      }
                    : e
                )
              }
            : d
        )
      );
    }

    function addExercise(dayIdx) {
      setPlan(p =>
        p.map((d, i) =>
          i === dayIdx
            ? {
                ...d,
                exercises: [
                  ...d.exercises,
                  { name: 'Новое упражнение', oneRM: 100, sets: [{ percent: 70 }] }
                ]
              }
            : d
        )
      );
    }

    function removeExercise(dayIdx, exIdx) {
      setPlan(p =>
        p.map((d, i) =>
          i === dayIdx
            ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
            : d
        )
      );
    }

    function addSet(dayIdx, exIdx) {
      setPlan(p =>
        p.map((d, i) =>
          i === dayIdx
            ? {
                ...d,
                exercises: d.exercises.map((e, j) =>
                  j === exIdx
                    ? { ...e, sets: [...e.sets, { percent: 70 }] }
                    : e
                )
              }
            : d
        )
      );
    }

    function removeSet(dayIdx, exIdx, setIdx) {
      setPlan(p =>
        p.map((d, i) =>
          i === dayIdx
            ? {
                ...d,
                exercises: d.exercises.map((e, j) =>
                  j === exIdx
                    ? { ...e, sets: e.sets.filter((_, k) => k !== setIdx) }
                    : e
                )
              }
            : d
        )
      );
    }

    function calculateWeight(oneRM, percent, week) {
      const base = (oneRM * percent) / 100;
      if (progressionType === 'kg') {
        return Math.round((base + progressionStep * week) * 10) / 10;
      } else {
        return Math.round((base * (1 + progressionStep / 100 * week)) * 10) / 10;
      }
    }

    function updateOneRMFromWeight(dayIdx, exIdx, weight, percent, week) {
      let base = weight;
      if (progressionType === 'kg') {
        base -= progressionStep * week;
      } else {
        base /= (1 + progressionStep / 100 * week);
      }
      const newOneRM = Math.round((base / (percent / 100)) * 10) / 10;
      updateExercise(dayIdx, exIdx, 'oneRM', newOneRM);
    }

    if (page === 'settings') {
      return h('div', { className: 'container' }, [
        h('h1', null, 'Настройки плана'),
        h('div', { className: 'card' }, [
          h('label', null, 'Шаблон: '),
          h('select', { value: template, onChange: e => loadTemplate(e.target.value) },
            Object.keys(SPLIT_TEMPLATES).map(k => h('option', { key: k, value: k }, k))
          )
        ]),
        h('div', { className: 'card' }, [
          h('label', null, 'Тип прогрессии: '),
          h('select', { value: progressionType, onChange: e => setProgressionType(e.target.value) }, [
            h('option', { value: 'kg' }, 'Кг'),
            h('option', { value: '%' }, 'Проценты')
          ]),
          h('label', null, ' Шаг: '),
          h('input', {
            type: 'number',
            value: progressionStep,
            onChange: e => setProgressionStep(parseFloat(e.target.value) || 0)
          }),
          h('label', null, ' Кол-во недель: '),
          h('input', {
            type: 'number',
            value: weeks,
            onChange: e => setWeeks(parseInt(e.target.value) || 1)
          })
        ]),
        plan.map((d, dayIdx) =>
          h('div', { className: 'card', key: dayIdx }, [
            h('h3', null, d.day),
            h('button', { onClick: () => addExercise(dayIdx) }, '➕ Упражнение'),
            d.exercises.map((e, exIdx) =>
              h('div', { key: exIdx, className: 'exercise-settings' }, [
                h('input', {
                  value: e.name,
                  onChange: ev => updateExercise(dayIdx, exIdx, 'name', ev.target.value),
                  className: 'exercise-name-input'
                }),
                h('label', null, '1ПМ:'),
                h('input', {
                  type: 'number',
                  value: e.oneRM,
                  onChange: ev => updateExercise(dayIdx, exIdx, 'oneRM', parseFloat(ev.target.value) || 0)
                }),
                h('div', { className: 'sets-config' },
                  e.sets.map((s, setIdx) =>
                    h('div', { key: setIdx, className: 'set-row' }, [
                      h('label', null, `%: `),
                      h('input', {
                        type: 'number',
                        value: s.percent,
                        onChange: ev => updateSet(dayIdx, exIdx, setIdx, 'percent', parseFloat(ev.target.value) || 0)
                      }),
                      h('button', { onClick: () => removeSet(dayIdx, exIdx, setIdx) }, '❌')
                    ])
                  )
                ),
                h('button', { onClick: () => addSet(dayIdx, exIdx) }, '➕ Подход'),
                h('button', { onClick: () => removeExercise(dayIdx, exIdx) }, '🗑️ Упражнение')
              ])
            )
          ])
        ),
        h('button', { className: 'primary', onClick: () => setPage('plan') }, 'Сохранить и перейти к плану')
      ]);
    }

    if (page === 'plan') {
      return h('div', { className: 'container' }, [
        h('h1', null, 'План тренировок'),
        h('button', { onClick: () => setPage('settings') }, '← Настройки'),
        [...Array(weeks)].map((_, week) =>
          h('div', { key: week, className: 'week-block' }, [
            h('h2', null, `Неделя ${week + 1}`),
            plan.map((d, dayIdx) =>
              h('div', { key: dayIdx, className: 'card' }, [
                h('h3', null, d.day),
                h('table', { className: 'plan-table' }, [
                  h('thead', null,
                    h('tr', null, [
                      h('th', null, 'Упражнение'),
                      h('th', null, '% от 1ПМ'),
                      h('th', null, 'Вес')
                    ])
                  ),
                  h('tbody', null,
                    d.exercises.map((e, exIdx) =>
                      e.sets.map((s, setIdx) =>
                        h('tr', { key: `${exIdx}-${setIdx}` }, [
                          h('td', { className: 'exercise-cell' }, e.name),
                          h('td', null, s.percent + '%'),
                          h('td', null,
                            h('input', {
                              type: 'number',
                              value: calculateWeight(e.oneRM, s.percent, week),
                              onChange: ev =>
                                updateOneRMFromWeight(dayIdx, exIdx, parseFloat(ev.target.value) || 0, s.percent, week)
                            })
                          )
                        ])
                      )
                    )
                  )
                ])
              ])
            )
          ])
        )
      ]);
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
