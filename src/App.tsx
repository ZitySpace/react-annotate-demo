import React, { useEffect, useState } from "react";

import {
  Annotator,
  ImageData,
  BoxLabel,
  MaskLabel,
  PointLabel,
} from "@ZitySpace/react-annotate";

const responseHandlerTemplate = async (response: Response) => {
  const data = await response.json();

  if (response.status > 400 && response.status <= 500) {
    const err = data.detail ? data.detail : data;
    throw err;
  }

  return data;
};

const requestTemplate =
  (
    requestConstructor: Function,
    responseHandler: Function = responseHandlerTemplate,
    dataTransformer: Function | null = null
  ) =>
  async (...args: any[]) => {
    const { url, method, headers, body } = requestConstructor(...args);
    const headersFinal = headers || new Headers({ Accept: "application/json" });

    const request = new Request(url, {
      method: method,
      headers: headersFinal,
      body: body,
    });
    const response = await fetch(request);

    const data = await responseHandler(response);

    return dataTransformer ? dataTransformer(data) : data;
  };

const apiEndpoint = process.env.REACT_APP_APIEndpoint;

const getAnnotations = requestTemplate((task: string) => ({
  url: apiEndpoint + "/" + task,
  method: "GET",
}));

const App = () => {
  const [task, setTask] = useState<string | null>(null);
  const [imagesList, setImagesList] = useState<ImageData[]>([]);
  const taskOptions = [
    "detection",
    "segmentation",
    "keypoints",
    "detection+segmentation",
    "keypoints+segmentation",
  ];

  useEffect(() => {
    (async () => {
      try {
        const data = await getAnnotations(task);

        if (task === "detection")
          data.forEach((img: any) => {
            img.annotations = img.annotations.map(
              (anno: any, id: number) =>
                new BoxLabel({
                  ...anno,
                  id,
                })
            );
          });

        console.log(data);
        setImagesList(data);
      } catch (err) {
        console.log(err instanceof Error ? err.message : (err as string));
      }
    })();
  }, [task]);

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="w-full bg-gray-100 p-2 shadow-lg">
        {/* <div className="xs:hidden">
          <label htmlFor="tasks" className="sr-only">
            Select a task
          </label>
          <select
            id="tasks"
            name="tasks"
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            defaultValue={""}
          >
            {taskOptions.map((task_) => (
              <option key={task_}>{task_}</option>
            ))}
          </select>
        </div> */}
        <div className="hidden sm:flex space-x-4">
          {taskOptions.map((task_) => (
            <button
              type="button"
              key={task_}
              className={`
                ${
                  task === task_
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:text-gray-700"
                } px-3 py-2 font-medium text-sm rounded-md
              `}
              onClick={() => setTask(task_)}
            >
              {task_}
            </button>
          ))}
        </div>
      </div>

      <Annotator
        imagesList={imagesList}
        initIndex={0}
        onSave={(d: ImageData) => {
          console.log(d);
          return true;
        }}
        onError={(m: string, c: any) => {
          console.log(m, c);
        }}
        onAddCategory={(c: string) => {
          console.log("add new category ", c);
          return true;
        }}
        onRenameCategory={(o: string, n: string, t?: string) => {
          console.log(o, " -> ", n, " @ ", t);
          return true;
        }}
      />
    </div>
  );
};

export default App;
