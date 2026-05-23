import { Composition, Still } from "remotion";
import { SafepartsExplainer, SafepartsPoster, TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from "./SafepartsExplainer";
import "./styles.css";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SafepartsExplainer"
        component={SafepartsExplainer}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Still
        id="SafepartsPoster"
        component={SafepartsPoster}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
