import React, { useState, useEffect } from 'react';
import { useRehab } from '../../context/RehabContext';
import { getTranslation } from '../../utils/i18n';
import { soundManager } from '../../utils/audio';
import {
  ShieldAlert,
  Heart,
  CheckCircle2,
  Activity,
  ArrowRight,
  Sparkles,
  Check,
  Target,
  RefreshCw,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { activePatient, completePatientOnboarding, language, voiceGuidance } = useRehab();
  const t = getTranslation(language);

  const [step, setStep] = useState<number>(1);
  const [measuringHR, setMeasuringHR] = useState<boolean>(true);
  const [checklist, setChecklist] = useState({
    shoulder: false,
    chest: false,
    grip: false,
  });

  // Movement assessment mini-game state
  const [assessmentReps, setAssessmentReps] = useState<number>(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (step === 2) {
      setMeasuringHR(true);
      const timer = setTimeout(() => {
        setMeasuringHR(false);
        soundManager.playTargetSuccess();
        soundManager.speak(
          'Baseline heart rate established at 72 beats per minute.',
          'en',
          voiceGuidance
        );
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [step, language, voiceGuidance]);

  const handleNextStep = () => {
    soundManager.playTargetSuccess();
    if (step < 4) {
      setStep(step + 1);
    } else {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      completePatientOnboarding(activePatient.id);
      onComplete();
    }
  };

  const handleAssessmentReach = () => {
    soundManager.playPop();
    const nextReps = assessmentReps + 1;
    setAssessmentReps(nextReps);

    if (nextReps < 5) {
      // Move target to random position within bounds
      setTargetPos({
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
      });
    } else {
      soundManager.playSessionComplete();
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6">
        {/* Step Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-wider">
              Onboarding Setup — Step {step} of 4
            </span>
            <span className="font-bold text-blue-600">
              {step === 1 && 'Welcome'}
              {step === 2 && 'Baseline HR'}
              {step === 3 && 'Sensor Fit'}
              {step === 4 && 'Kinematic Baseline'}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-full flex-1 transition-all duration-300 ${
                  s <= step ? 'bg-blue-600' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Welcome & Disclaimer */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t.onboardingStep1Title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t.onboardingStep1Desc}
              </p>
            </div>

            {/* Medical Disclaimer Box */}
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Medical Prototype Notice: </span>
                {t.onboardingDisclaimer}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleNextStep}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.continueBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Baseline Heart Rate Simulation */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t.onboardingStep2Title}
              </h2>
              <p className="text-xs text-slate-500">
                Establishing individual cardiac threshold for exercise safety governance.
              </p>
            </div>

            {/* Measuring Heart Rate Animation Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-rose-50/70 to-slate-50 border border-rose-100 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-lg border border-rose-100 flex items-center justify-center mx-auto text-[#FF375F]">
                  <Heart className={`w-10 h-10 ${measuringHR ? 'animate-bounce' : 'fill-[#FF375F]'}`} />
                </div>
              </div>

              {measuringHR ? (
                <div className="space-y-2">
                  <div className="text-base font-bold text-slate-800 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 text-rose-500 animate-spin" />
                    <span>{t.measuring}</span>
                  </div>
                  <p className="text-xs text-slate-500">Calibrating demo optical PPG signal...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-mono text-4xl font-extrabold text-slate-900">
                    72 <span className="text-lg font-sans font-medium text-slate-500">BPM</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.safe}
                  </div>
                  <p className="text-xs text-slate-600 font-medium pt-2">
                    {t.baselineEstablished}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-center text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 inline mr-1" />
              {t.notRealMeasurement}
            </div>

            <div className="pt-2">
              <button
                onClick={handleNextStep}
                disabled={measuringHR}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  measuringHR
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer'
                }`}
              >
                <span>{t.continueBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Harness & Sensors Checklist */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t.onboardingStep3Title}
              </h2>
              <p className="text-xs text-slate-500">
                Confirm your simulated wearable sensors are properly mounted before therapy.
              </p>
            </div>

            <div className="space-y-3">
              {/* Shoulder Support */}
              <label
                onClick={() => setChecklist((prev) => ({ ...prev, shoulder: !prev.shoulder }))}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  checklist.shoulder
                    ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      checklist.shoulder ? 'bg-blue-600 text-white' : 'border border-slate-300'
                    }`}
                  >
                    {checklist.shoulder && <Check className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.checklistShoulder}</p>
                    <p className="text-[11px] text-slate-500">Aligns upper arm IMU to glenohumeral joint</p>
                  </div>
                </div>
              </label>

              {/* Chest Sensor */}
              <label
                onClick={() => setChecklist((prev) => ({ ...prev, chest: !prev.chest }))}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  checklist.chest
                    ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      checklist.chest ? 'bg-blue-600 text-white' : 'border border-slate-300'
                    }`}
                  >
                    {checklist.chest && <Check className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.checklistChest}</p>
                    <p className="text-[11px] text-slate-500">Sternum orientation sensor for trunk lean detection</p>
                  </div>
                </div>
              </label>

              {/* Grip Sensor */}
              <label
                onClick={() => setChecklist((prev) => ({ ...prev, grip: !prev.grip }))}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  checklist.grip
                    ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      checklist.grip ? 'bg-blue-600 text-white' : 'border border-slate-300'
                    }`}
                  >
                    {checklist.grip && <Check className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.checklistGrip}</p>
                    <p className="text-[11px] text-slate-500">Palmar isometric pressure transducer</p>
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleNextStep}
                disabled={!(checklist.shoulder && checklist.chest && checklist.grip)}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  checklist.shoulder && checklist.chest && checklist.grip
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{t.setupCompleteBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Movement Calibration Assessment */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t.onboardingStep4Title}
              </h2>
              <p className="text-xs text-slate-500">
                {t.movementAssessDesc}
              </p>
            </div>

            {/* Interactive Target Reach Area */}
            <div className="relative h-64 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Completed: {assessmentReps} / 5</span>
                <span className="text-emerald-400 font-semibold">
                  {assessmentReps === 5 ? 'Calibration Complete!' : 'Click/Tap Target'}
                </span>
              </div>

              {assessmentReps < 5 ? (
                <button
                  onClick={handleAssessmentReach}
                  style={{
                    position: 'absolute',
                    left: `${targetPos.x}%`,
                    top: `${targetPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/50 hover:scale-110 active:scale-95 transition-transform cursor-pointer border-2 border-white animate-pulse"
                >
                  <Target className="w-8 h-8" />
                </button>
              ) : (
                <div className="my-auto text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white">Baseline Established</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {t.repsCalibrated}
                  </p>
                </div>
              )}

              <div className="text-[10px] text-slate-500 text-center font-mono">
                Kinematic Calibration: 3D Workspace Model Ready
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleNextStep}
                disabled={assessmentReps < 5}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  assessmentReps >= 5
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{t.enterRehabBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
