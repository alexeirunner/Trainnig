(function () {
  const { createElement: h, useState, useEffect, useMemo } = React;

  // Ключ для локального хранилища (persist)
  const LS_KEY = 'trainnig-plan-v1';

  // Стартовый план (пример 4-дневного сплита)
  const DEFAULT_PLAN = [
    {
      day: 'ПН — Грудь/Трицепс',
      items: [
        { ex: 'Жим лёжа', sets: 4, reps: '6–8', weight: '', rest: '90с', notes: '', done: false },
        { ex: 'Разводки с гантелями', sets: 3, reps: '10–12', weight: '', rest: '60с', notes: '', done: false },
        { ex: 'Отжимания на брусьях', sets: 3, reps: '8–12', weight: 'вес тела', rest: '60с', notes: '', done: false },
        { ex: 'Французский жим', sets: 3, reps: '8–10', weight: '', rest: '75с', notes: '', done: false }
      ]
    },
    {
      day: 'ВТ — Спина/Бицепс',
      items: [
        { ex: 'Тяга штанги в наклоне', sets: 4, reps: '6–8', weight: '', rest: '90с', notes: '', done: false },
        { ex: 'Тяга верхнего блока', sets: 3, reps: '10–12', weight: '', rest: '75с', notes: '', done: false },
        { ex: 'Подтягивания', sets: 3, reps: 'макс', weight: 'вес тела', rest: '90с', notes: '', done: false },
        { ex: 'Подъём штанги на бицепс', sets: 3, reps: '8–10', weight: '', rest: '75с', notes: '', done: false }
      ]
    },
    {
      day: 'ЧТ — Ноги/Ядро',
      items: [
        { ex: 'Приседания', sets: 4, reps: '5–8', weight: '', rest: '120с', notes: '', done: false },
        { ex: 'Жим ногами', sets: 3, reps: '10–12', weight: '', rest: '90с', notes: '', done: false },
        { ex: 'Румынская тяга', sets: 3, reps: '8–10', weight: '', rest: '90с', notes: '', done: false },
        { ex: 'Планка', sets: 3, reps: '45–60с', weight: '-', rest: '60с', notes: '', done: false }
      ]
    },
    {
      day: 'СБ — Плечи/Добивка',
      items: [
        { ex: 'Жим стоя', sets: 4, reps: '6–8', weight: '', rest: '90с', notes: '', done: false },
        { ex: 'Разведения в стороны', sets: 3, reps: '12–15', weight: '', rest: '60с', notes: '', done: false },
        { ex: 'Тяга к подбородку', sets: 3, reps: '8–10', weight: '', rest: '75с', notes: '', done: false },
        { ex: 'Суперсет: пресс', sets: 3, reps: '15–20', weight: '-', rest: '45с', notes: '', done: false }
      ]
    }
  ];

  // Утилиты хранения
  const savePlan = (plan) => localStorage.setItem(LS_KEY, JSON.stringify(plan));
  const loadPlan = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Нормализация (на случай старых версий)
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  function Toolbar({ onAddDay, onReset, onExport, onImport, search, setSearch }) {
    return h('div', { className: 'toolbar card' }, [
      h('div', { className: 'row wrap' }, [
        h('button', { onClick: onAddDay, title: 'Добавить новый день' }, '➕ День'),
        h('button', { onClick: onReset, title: 'Очистить и восстановить базовый план' }, '♻️ Сброс'),
        h('button', { onClick: onExport, title: 'Сохранить JSON-файл плана' }, '📤 Экспорт'),
        h('button', { onClick: onImport, title: 'Загрузить JSON-файл плана' }, '📥 Импорт')
      ]),
      h('div', { className: 'row' }, [
        h('input', {
          className: 'input',
          placeholder: 'Поиск по упражнениям/дням…',
          value: search,
          onChange: (e) => setSearch(e.target.value)
        })
      ])
    ]);
  }

  function DayCard({ idx, day, onChangeDayName, onAddExercise, onRemoveDay, children }) {
    return h('div', { className: 'day card' }, [
      h('div', { className: 'day-header row wrap' }, [
        h('input', {
          className: 'input title',
          value: day,
          onChange: (e) => onChangeDayName(idx, e.target.value)
        }),
        h('div', { className: 'row gap8' }, [
          h('button', { onClick: () => onAddExercise(idx), title: 'Добавить упражнение' }, '➕ Упражнение'),
          h('button', { onClick: () => onRemoveDay(idx), title: 'Удалить день' }, '🗑️ День')
        ])
      ]),
      children
    ]);
  }

  function Table({ rows, onEdit, onToggle, onDelete }) {
    const headers = ['✓', 'Упражнение', 'Подх.', 'Повт.', 'Вес', 'Отдых', 'Заметки', '—'];
    return h('div', { className: 'table-wrap' }, [
      h('table', { className: 'plan-table' }, [
        h('thead', null, [
          h('tr', null, headers.map((hname, i) => h('th', { key: i }, hname)))
        ]),
        h('tbody', null, rows.map((r, i) =>
          h('tr', { key: i, className: r.done ? 'done' : '' }, [
            h('td', null, h('input', {
              type: 'checkbox',
              checked: r.done || false,
              onChange: (e) => onToggle(i, e.target.checked),
              title: 'Отметить выполнение'
            })),
            h('td', null, h('input', {
              className: 'cell-input',
              value: r.ex,
              onChange: (e) => onEdit(i, 'ex', e.target.value),
              placeholder: 'Название упражнения'
            })),
            h('td', null, h('input', {
              className: 'cell-input num',
              value: r.sets,
              onChange: (e) => onEdit(i, 'sets', e.target.value)
            })),
            h('td', null, h('input', {
              className: 'cell-input',
              value: r.reps,
              onChange: (e) => onEdit(i, 'reps', e.target.value),
              placeholder: 'напр. 8–10'
            })),
            h('td', null, h('input', {
              className: 'cell-input',
              value: r.weight,
              onChange: (e) => onEdit(i, 'weight', e.target.value),
              placeholder: 'кг/вес тела'
            })),
            h('td', null, h('input', {
              className: 'cell-input',
              value: r.rest,
              onChange: (e) => onEdit(i, 'rest', e.target.value),
              placeholder: 'секунды'
            })),
            h('td', null, h('input', {
              className: 'cell-input',
              value: r.notes,
              onChange: (e) => onEdit(i, 'notes', e.target.value),
              placeholder: 'заметки'
            })),
            h('td', null, h('button', { className: 'icon-btn', title: 'Удалить упражнение', onClick: () => onDelete(i) }, '🗑️'))
          ])
        ))
      ])
    ]);
  }

  function App() {
    const [plan, setPlan] = useState(() => loadPlan() || DEFAULT_PLAN);
    const [search, setSearch] = useState('');

    // Сохраняем при каждом изменении
    useEffect(() => { savePlan(plan); }, [plan]);

    const filteredPlan = useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return plan;
      return plan
        .map(day => ({
          ...day,
          items: day.items.filter(r =>
            (day.day.toLowerCase().includes(q)) ||
            (r.ex?.toLowerCase?.().includes(q)) ||
            (r.notes?.toLowerCase?.().includes(q))
          )
        }))
        .filter(d => d.items.length > 0 || d.day.toLowerCase().includes(q));
    }, [plan, search]);

    const addDay = () => {
      const name = `Новый день ${plan.length + 1}`;
      setPlan(p => [...p, { day: name, items: [] }]);
    };

    const removeDay = (dayIdx) => {
      setPlan(p => p.filter((_, i) => i !== dayIdx));
    };

    const changeDayName = (dayIdx, value) => {
      setPlan(p => p.map((d, i) => i === dayIdx ? { ...d, day: value } : d));
    };

    const addExercise = (dayIdx) => {
      setPlan(p => p.map((d, i) => {
        if (i !== dayIdx) return d;
        return {
          ...d,
          items: [
            ...d.items,
            { ex: 'Новое упражнение', sets: 3, reps: '8–10', weight: '', rest: '60с', notes: '', done: false }
          ]
        };
      }));
    };

    const editRow = (dayIdx, rowIdx, field, value) => {
      setPlan(p => p.map((d, i) => {
        if (i !== dayIdx) return d;
        const items = d.items.map((r, j) => (j === rowIdx ? { ...r, [field]: value } : r));
        return { ...d, items };
      }));
    };

    const toggleRow = (dayIdx, rowIdx, checked) => {
      setPlan(p => p.map((d, i) => {
        if (i !== dayIdx) return d;
        const items = d.items.map((r, j) => (j === rowIdx ? { ...r, done: checked } : r));
        return { ...d, items };
      }));
    };

    const deleteRow = (dayIdx, rowIdx) => {
      setPlan(p => p.map((d, i) => {
        if (i !== dayIdx) return d;
        const items = d.items.filter((_, j) => j !== rowIdx);
        return { ...d, items };
      }));
    };

    const resetPlan = () => {
      if (confirm('Вернуть базовый план? Все текущие изменения будут потеряны.')) {
        setPlan(DEFAULT_PLAN);
        setSearch('');
      }
    };

    const exportPlan = () => {
      const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trainnig-plan.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    const importPlan = () => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'application/json';
      inp.onchange = () => {
        const file = inp.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const json = JSON.parse(String(reader.result));
            if (!Array.isArray(json)) throw new Error('Некорректный формат');
            setPlan(json);
            setSearch('');
          } catch (e) {
            alert('Не удалось импортировать JSON: ' + e.message);
          }
        };
        reader.readAsText(file);
      };
      inp.click();
    };

    return h('div', { className: 'container' }, [
      h('h1', null, 'Тренировочный сплит (PWA)'),
      h('p', { className: 'muted' }, 'Редактируемая таблица, офлайн, экспорт/импорт, поиск.'),

      h(Toolbar, {
        onAddDay: addDay,
        onReset: resetPlan,
        onExport: exportPlan,
        onImport: importPlan,
        search,
        setSearch
      }),

      // Рендерим дни
      filteredPlan.length === 0
        ? h('div', { className: 'card' }, 'Ничего не найдено по фильтру.')
        : filteredPlan.map((d, dayIdxFiltered) => {
            // Найдём реальный индекс дня в исходном плане,
            // чтобы корректно применялись операции редактирования
            const dayIdxReal = plan.findIndex(x => x.day === d.day && x.items === d.items);

            return h(DayCard, {
              key: d.day + dayIdxFiltered,
              idx: dayIdxReal,
              day: d.day,
              onChangeDayName: changeDayName,
              onAddExercise: addExercise,
              onRemoveDay: removeDay
            }, [
              h(Table, {
                rows: d.items,
                onEdit: (rowIdx, field, value) => editRow(dayIdxReal, rowIdx, field, value),
                onToggle: (rowIdx, checked) => toggleRow(dayIdxReal, rowIdx, checked),
                onDelete: (rowIdx) => deleteRow(dayIdxReal, rowIdx)
              })
            ]);
          })
    ]);
  }

  const root = document.getElementById('root');
  ReactDOM.createRoot(root).render(h(App));
})();
