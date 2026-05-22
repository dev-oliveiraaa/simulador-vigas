import { useState, useEffect } from 'react'
import './Onboarding.css'

const STORAGE_KEY = 'simulador-vigas-onboarding-seen'

const STEPS = [
  {
    title: 'Escolha o tipo de viga',
    desc: 'Selecione a configuração de apoios: simplesmente apoiada, em balanço, com balanço ou contínua.',
  },
  {
    title: 'Defina a geometria',
    desc: 'Informe o comprimento total L (m) e, se necessário, a posição dos apoios intermediários.',
  },
  {
    title: 'Adicione as cargas',
    desc: 'Adicione cargas pontuais, distribuídas ou momentos. Você pode combinar quantas quiser.',
  },
  {
    title: 'Calcule',
    desc: 'Clique em "Calcular" ou pressione Enter. Os diagramas e resultados aparecem automaticamente.',
  },
]

/**
 * Onboarding — Tutorial overlay shown on first visit.
 *
 * @param {object} props
 * @param {boolean} props.forceShow - Force show even if previously dismissed
 * @param {Function} props.onClose - Callback when closed
 */
function Onboarding({ forceShow = false, onClose }) {
  const [visible, setVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (forceShow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true)
      setCurrentStep(0)
      return
    }

    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      setVisible(true)
    }
  }, [forceShow])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
    setCurrentStep(0)
    onClose?.()
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  if (!visible) return null

  return (
    <div className="onboarding-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-label="Tutorial de uso">
      <div className="onboarding-card" onClick={(e) => e.stopPropagation()}>
        <div className="onboarding-card__header">
          <h2 className="onboarding-card__title">Como usar</h2>
          <button
            className="onboarding-card__close"
            onClick={handleClose}
            aria-label="Fechar tutorial"
          >
            ✕
          </button>
        </div>

        <div className="onboarding-steps">
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className={`onboarding-step ${idx === currentStep ? 'onboarding-step--active' : ''}`}
            >
              <div className="onboarding-step__number">{idx + 1}</div>
              <div className="onboarding-step__content">
                <span className="onboarding-step__title">{step.title}</span>
                <span className="onboarding-step__desc">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="onboarding-tip">
          <strong>Dica:</strong> para calcular a flecha elástica, informe o módulo
          de elasticidade (E) e o momento de inércia (I) da seção transversal.
        </div>

        <div className="onboarding-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Pular
          </button>
          <button className="btn btn-primary" onClick={handleNext} id="onboarding-next-btn">
            {currentStep < STEPS.length - 1 ? 'Próximo' : 'Começar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
