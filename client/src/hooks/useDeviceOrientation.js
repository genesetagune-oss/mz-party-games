// client/src/hooks/useDeviceOrientation.js
// ✅ Hook para detetar inclinação do telemóvel (cima/baixo) com DeviceOrientationEvent

import { useEffect, useState } from "react";

/**
 * Hook que retorna:
 * - tilt: -1 (inclinar para baixo), 0 (centro), 1 (inclinar para cima)
 * - hasPermission: boolean (permissão de acesso ao sensor)
 * - requestPermission: função para pedir permissão (iOS 13+)
 */
export const useDeviceOrientation = () => {
  const [tilt, setTilt] = useState(0); // -1 (baixo), 0 (centro), +1 (cima)
  const [hasPermission, setHasPermission] = useState(false);

  // ────────────────────────────────────────────────────────
  // Pedir permissão (iOS 13+)
  // ────────────────────────────────────────────────────────
  const requestPermission = async () => {
    // iOS 13+ — precisa de permissão explícita
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === "granted") {
          setHasPermission(true);
          return true;
        }
      } catch (err) {
        console.error("❌ Permissão de sensor negada:", err);
        setHasPermission(false);
        return false;
      }
    } else {
      // Android e navegadores que não pedem permissão explícita
      setHasPermission(true);
      return true;
    }
  };

  // ────────────────────────────────────────────────────────
  // Setup inicial
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    requestPermission();
  }, []);

  // ────────────────────────────────────────────────────────
  // Listener de orientação
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasPermission) {
      console.warn("⚠️ Sem permissão para sensor de orientação");
      return;
    }

    const handleOrientation = (event) => {
      // Beta: rotação frente-trás (-180 a 180)
      // Beta negativo = inclinar para cima
      // Beta positivo = inclinar para baixo
      const beta = event.beta;

      if (beta === null || beta === undefined) {
        setTilt(0);
        return;
      }

      // Threshold: 30 graus de cada lado
      if (beta < -30) {
        setTilt(1); // ACERTO (cima) ✅
      } else if (beta > 30) {
        setTilt(-1); // ERRO (baixo) ❌
      } else {
        setTilt(0); // Centro (calmo)
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [hasPermission]);

  return { tilt, hasPermission, requestPermission };
};
