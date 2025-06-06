const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

var createScene = function () {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.5, 0.8, 1.0);

  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    10,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);

  const light = new BABYLON.DirectionalLight(
    "light",
    new BABYLON.Vector3(0, -1, 1),
    scene
  );
  light.position = new BABYLON.Vector3(0, 10, -10);
  light.intensity = 1;

  const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;

  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 30, height: 30 },
    scene
  );
  const grassMat = new BABYLON.StandardMaterial("grassMat", scene);
  grassMat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
  ground.material = grassMat;
  ground.receiveShadows = true;

  const headMat = new BABYLON.StandardMaterial("headMat", scene);
  headMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6);

  const bodyMat = new BABYLON.StandardMaterial("bodyMat", scene);
  bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 1);

  const legMat = new BABYLON.StandardMaterial("legMat", scene);
  legMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.5);

  const handMat = new BABYLON.StandardMaterial("handMat", scene);
  handMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6);

  const head = BABYLON.MeshBuilder.CreateBox("head", { size: 1 }, scene);
  head.position.y = 2.5;
  head.material = headMat;

  const body = BABYLON.MeshBuilder.CreateBox(
    "body",
    { height: 1.5, width: 1, depth: 0.6 },
    scene
  );
  body.position.y = 1.5;
  body.material = bodyMat;

  const faceMat = new BABYLON.StandardMaterial("faceMat", scene);
  faceMat.diffuseColor = new BABYLON.Color3.Black();

  const eyeLeft = BABYLON.MeshBuilder.CreateBox(
    "eyeLeft",
    { height: 0.1, width: 0.1, depth: 0.01 },
    scene
  );
  eyeLeft.parent = head;
  eyeLeft.material = faceMat;
  eyeLeft.position.set(-0.15, 0.1, -0.51);

  const eyeRight = eyeLeft.clone("eyeRight");
  eyeRight.position.x = 0.15;

  const nose = BABYLON.MeshBuilder.CreateBox(
    "nose",
    { height: 0.1, width: 0.05, depth: 0.05 },
    scene
  );
  nose.parent = head;
  nose.material = faceMat;
  nose.position.set(0, -0.05, -0.5);

  const mouth = BABYLON.MeshBuilder.CreateBox(
    "mouth",
    { height: 0.05, width: 0.3, depth: 0.01 },
    scene
  );
  mouth.parent = head;
  mouth.material = faceMat;
  mouth.position.set(0, -0.2, -0.51);

  const legLeft = BABYLON.MeshBuilder.CreateBox(
    "legLeft",
    { height: 1, width: 0.4, depth: 0.4 },
    scene
  );
  legLeft.position.set(-0.3, 0.5, 0);
  legLeft.material = legMat;

  const legRight = legLeft.clone("legRight");
  legRight.position.x = 0.3;

  const handLeft = BABYLON.MeshBuilder.CreateBox(
    "handLeft",
    { height: 1, width: 0.4, depth: 0.4 },
    scene
  );
  handLeft.position.set(-0.8, 1.5, 0);
  handLeft.material = handMat;

  const handRight = handLeft.clone("handRight");
  handRight.position.x = 0.8;

  const character = new BABYLON.TransformNode("character", scene);
  [head, body, legLeft, legRight, handLeft, handRight].forEach(
    (part) => (part.parent = character)
  );
  [head, body, legLeft, legRight, handLeft, handRight].forEach((mesh) =>
    shadowGenerator.addShadowCaster(mesh)
  );

  // === Input Movement Handling ===
  const inputMap = {};
  scene.actionManager = new BABYLON.ActionManager(scene);

  scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger,
      (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = true;
      }
    )
  );

  scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyUpTrigger,
      (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
      }
    )
  );

  // === Physics Jump Logic ===
  let isJumping = false;
  let velocityY = 0;
  const gravity = -0.02;

  const speed = 0.1;

  scene.onBeforeRenderObservable.add(() => {
    const t = performance.now() * 0.005;
    let isMoving = false;

    let moveX = 0;
    let moveZ = 0;

    if (inputMap["w"]) {
      moveZ -= 1;
      isMoving = true;
    }
    if (inputMap["s"]) {
      moveZ += 1;
      isMoving = true;
    }
    if (inputMap["a"]) {
      moveX -= 1;
      isMoving = true;
    }
    if (inputMap["d"]) {
      moveX += 1;
      isMoving = true;
    }

    // Normalisasi agar diagonal tidak lebih cepat
    const length = Math.hypot(moveX, moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;

      character.position.x += moveX * speed;
      character.position.z += moveZ * speed;

      // ROTASI MENGHADAP ARAH
      character.rotation.y = Math.atan2(moveX, moveZ);
    }

    // Lompat
    if (inputMap[" "] && !isJumping) {
      velocityY = 0.4;
      isJumping = true;
    }

    if (isJumping) {
      character.position.y += velocityY;
      velocityY += gravity;

      if (character.position.y <= 0) {
        character.position.y = 0;
        isJumping = false;
      }
    }

    // Animasi tangan dan kaki saat bergerak
    legLeft.rotation.x = isMoving ? Math.sin(t) * 0.5 : 0;
    legRight.rotation.x = isMoving ? -Math.sin(t) * 0.5 : 0;
    handLeft.rotation.x = isMoving ? -Math.sin(t) * 0.5 : 0;
    handRight.rotation.x = isMoving ? Math.sin(t) * 0.5 : 0;
  });

  return scene;
};

const scene = createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
