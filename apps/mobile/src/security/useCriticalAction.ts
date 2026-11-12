import { useCallback, useRef, useState } from 'react';
import { useAppDispatch } from '../store';
import { useVerifyStepUpMutation } from '../store/api';
import { elevationGranted } from '../store/stepUpSlice';
import { readApiError } from './apiError';
import { stepAfterActionError, stepAfterVerifyError } from './criticalAction';

/**
 * - idle: nada en curso.
 * - running: se está haciendo la acción.
 * - needs_code: se pidió el código (la ventana de step-up está abierta).
 * - verifying: se está verificando el código.
 * - needs_enrollment: la persona debe activar primero el 2FA.
 * - failed: algo falló; message lo explica.
 * - done: la acción terminó; result tiene la respuesta.
 */
export type CriticalPhase =
  | 'idle'
  | 'running'
  | 'needs_code'
  | 'verifying'
  | 'needs_enrollment'
  | 'failed'
  | 'done';

/**
 * Ejecuta una acción crítica con step-up (decisión 0002, sección 5). La
 * acción recibida debe lanzar el error de RTK Query (usar .unwrap()).
 */
export function useCriticalAction<T>(perform: () => Promise<T>) {
  const dispatch = useAppDispatch();
  const [verify] = useVerifyStepUpMutation();
  const [phase, setPhase] = useState<CriticalPhase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const stepUpToken = useRef<string | null>(null);
  // La ventana del código sigue abierta desde que se pide el código hasta que
  // la acción termina, para que el lector de pantalla no pierda el contexto.
  const [inStepUp, setInStepUp] = useState(false);

  const run = useCallback(
    async (notice: string | null = null) => {
      setPhase('running');
      setMessage(notice);
      setCodeError(null);
      try {
        const value = await perform();
        stepUpToken.current = null;
        setResult(value);
        setMessage(null);
        setInStepUp(false);
        setPhase('done');
      } catch (error) {
        const step = stepAfterActionError(readApiError(error));
        if (step.kind === 'ask_code') {
          stepUpToken.current = step.stepUpToken;
          setInStepUp(true);
          setPhase('needs_code');
        } else {
          stepUpToken.current = null;
          setInStepUp(false);
          setMessage(step.message);
          setPhase(step.kind === 'needs_enrollment' ? 'needs_enrollment' : 'failed');
        }
      }
    },
    [perform],
  );

  const submitCode = useCallback(
    async (code: string) => {
      const token = stepUpToken.current;
      if (!token) return;
      setPhase('verifying');
      setCodeError(null);
      try {
        const elevation = await verify({ stepUpToken: token, code }).unwrap();
        dispatch(elevationGranted(elevation));
        stepUpToken.current = null;
        // Con el token elevado, se repite la acción pendiente.
        await run();
      } catch (error) {
        const step = stepAfterVerifyError(readApiError(error));
        if (step.kind === 'retry_code') {
          setCodeError(step.message);
          setPhase('needs_code');
        } else if (step.kind === 'restart_action') {
          await run(step.message);
        } else {
          stepUpToken.current = null;
          setInStepUp(false);
          setMessage(step.message);
          setPhase('failed');
        }
      }
    },
    [dispatch, run, verify],
  );

  const cancel = useCallback(() => {
    stepUpToken.current = null;
    setInStepUp(false);
    setCodeError(null);
    setMessage(null);
    setPhase('idle');
  }, []);

  return {
    phase,
    message,
    codeError,
    result,
    run: () => run(),
    submitCode,
    cancel,
    /** La ventana del código debe estar abierta. */
    isAskingCode: inStepUp,
    /** Verificando el código o repitiendo la acción con el token elevado. */
    isBusy: phase === 'verifying' || phase === 'running',
  };
}
