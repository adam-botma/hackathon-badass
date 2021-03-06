import React from "react";
import "./App.css";
import Header from "./Components/Header";
import initialData from "./data/dummy-data";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import KanbanColumn from "./Components/KanbanColumn";
import NewTaskModal from "./Components/NewTaskModal";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import BadgeModal from "./Components/BadgeModal";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import TutorialModal from "./Components/TutorialModal";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...initialData,
      newProjectValue: "",
      newColumn: "",
      formVisibility: "hidden",
      newTaskVisibility: false,
      newTaskName: "",
      newTaskDescription: "",
      newTaskImage: "",
      newTaskColumnId: "null",
      badgeModal: false,
      level: 0,
      confetti: false,
      tutorialDisplay: "block",
    };
    this.addColumn = this.addColumn.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleFormVisibility = this.toggleFormVisibility.bind(this);
    this.addTask = this.addTask.bind(this);
    this.editTask = this.editTask.bind(this);
    this.editContent = this.editContent.bind(this);
    this.editColumn = this.editColumn.bind(this);
    this.editProject = this.editProject.bind(this);
    this.deleteTask = this.deleteTask.bind(this);
    this.taskNameChange = this.taskNameChange.bind(this);
    this.taskDescriptionChange = this.taskDescriptionChange.bind(this);
    this.taskImageChange = this.taskImageChange.bind(this);
    this.toggleNewTask = this.toggleNewTask.bind(this);
    this.deleteColumn = this.deleteColumn.bind(this);
    this.newProject = this.newProject.bind(this);
    this.checkCompleted = this.checkCompleted.bind(this);
    this.closeBadgeModal = this.closeBadgeModal.bind(this);
    this.getBase64 = this.getBase64.bind(this);
    this.editImage = this.editImage.bind(this);
    this.toggleTutorial = this.toggleTutorial.bind(this);
  }

  componentDidMount() {
    const localstorage = JSON.parse(localStorage.getItem("state"));
    if (localstorage) {
      this.setState(localstorage);
    }
  }

  onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "column") {
      const newColumnOrder = Array.from(this.state.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);

      const newState = {
        ...this.state,
        columnOrder: newColumnOrder,
        confetti: false,
      };
      this.setState(newState, () =>
        localStorage.setItem("state", JSON.stringify(this.state))
      );
      return;
    }

    const start = this.state.columns[source.droppableId];
    const finish = this.state.columns[destination.droppableId];

    // Moving tasks within the same column
    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...start,
        taskIds: newTaskIds,
      };

      const newState = {
        ...this.state,
        columns: {
          ...this.state.columns,
          [newColumn.id]: newColumn,
        },
        confetti: false,
      };

      this.setState(newState, () =>
        localStorage.setItem("state", JSON.stringify(this.state))
      );
      return;
    }

    // Moving tasks between columns
    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...start,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finish,
      taskIds: finishTaskIds,
    };

    const newState = {
      ...this.state,
      columns: {
        ...this.state.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
      confetti: false,
    };
    this.setState(newState, () => {
      localStorage.setItem("state", JSON.stringify(this.state));
      if (destination.droppableId === "column-3") {
        this.checkCompleted();
      }
    });
  };

  checkCompleted() {
    const numCompleted = this.state.columns["column-3"].taskIds.length;
    if (numCompleted % 5 === 0 && numCompleted < 51) {
      if (numCompleted > 45) {
        this.setState(
          (state) => ({
            ...state,
            badgeModal: true,
            level: numCompleted / 5,
            levelImage: "super-star.svg",
          }),
          () => localStorage.setItem("state", JSON.stringify(this.state))
        );
      } else {
        this.setState(
          (state) => ({
            ...state,
            badgeModal: true,
            level: numCompleted / 5,
            levelImage: `level-${numCompleted / 5}.svg`,
          }),
          () => localStorage.setItem("state", JSON.stringify(this.state))
        );
      }
    } else {
      this.setState(
        (state) => ({
          ...state,
          confetti: true,
        }),
        () => localStorage.setItem("state", JSON.stringify(this.state))
      );
    }
  }

  handleChange(event) {
    const value = event.target.value;
    this.setState({ newColumn: value });
  }

  taskNameChange(event) {
    const value = event.target.value;
    this.setState({ newTaskName: value });
  }

  taskDescriptionChange(event) {
    const value = event.target.value;
    this.setState({ newTaskDescription: value });
  }

  getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  taskImageChange(event) {
    const file = event.target.files[0];
    if (file.size > 500000) {
      alert(
        "File size is too big! Please choose a photo that is less than 500KB"
      );
      this.setState({ newTaskImage: "" });
    } else {
      this.getBase64(file).then((base64) => {
        this.setState({ newTaskImage: base64 });
      });
    }
  }

  addColumn(event) {
    event.preventDefault();
    const { columnOrder, newColumn } = this.state;

    const colors = ["red", "yellow", "blue"];

    const randomColor = Math.floor(Math.random() * colors.length);

    //Addint to columnOrder
    let newColumnOrder = columnOrder.slice();
    newColumnOrder.push(newColumn);

    //Adding to columns

    this.setState(
      (state) => ({
        ...state,
        columns: {
          ...state.columns,
          [newColumn]: {
            id: newColumn,
            title: newColumn,
            taskIds: [],
            color: colors[randomColor],
          },
        },
        columnOrder: newColumnOrder,
      }),
      () => localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  deleteColumn(id) {
    let currentColumns = Object.assign({}, this.state.columns);
    const tasksToDelete = Array.from(this.state.columns[id].taskIds);
    const currentTasks = Object.assign({}, this.state.tasks);
    delete currentColumns[id];

    for (let index = 0; index < tasksToDelete.length; index++) {
      delete currentTasks[tasksToDelete[index]];
    }

    const currentColumnOrder = Array.from(this.state.columnOrder);

    currentColumnOrder.splice(currentColumnOrder.indexOf(id), 1);

    const newState = {
      ...this.state,
      tasks: currentTasks,
      columns: currentColumns,
      columnOrder: currentColumnOrder,
    };
    this.setState(newState, () =>
      localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  toggleNewTask(event) {
    if (!this.state.newTaskVisibility) {
      this.setState({
        newTaskVisibility: true,
        newTaskColumnId: event.currentTarget.id,
      });
    } else {
      this.setState({
        newTaskVisibility: false,
        newTaskColumnId: "null",
        newTaskName: "",
        newTaskDescription: "",
      });
    }
  }

  addTask(event) {
    event.preventDefault();
    const {
      newTaskName,
      newTaskDescription,
      newTaskColumnId,
      newTaskImage,
    } = this.state;

    //add to tasks
    let newTaskId = `task-${Object.keys(this.state.tasks).length + 1}`;

    //Add taskId to proper column
    let columns = { ...this.state.columns };
    let updatedColumnTaskIds = columns[newTaskColumnId].taskIds.slice();
    updatedColumnTaskIds.push(newTaskId);

    //updating tasks and column taskIds array
    this.setState(
      (state) => ({
        ...state,
        tasks: {
          ...state.tasks,
          [newTaskId]: {
            id: newTaskId,
            title: newTaskName,
            content: newTaskDescription,
            image: newTaskImage,
          },
        },
        columns: {
          ...state.columns,
          [newTaskColumnId]: {
            ...state.columns[newTaskColumnId],
            id: newTaskColumnId,
            taskIds: updatedColumnTaskIds,
          },
        },
        newTaskVisibility: false,
        newTaskName: "",
        newTaskDescription: "",
        newTaskColumnId: "null",
        newTaskImage: "",
      }),
      () => localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  editTask(id, newTask) {
    this.setState(
      (state) => ({
        ...state,
        tasks: {
          ...state.tasks,
          [id]: {
            ...state.tasks[id],
            title: newTask,
          },
        },
      }),
      () => localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  editContent(id, newContent) {
    this.setState((state) => ({
      ...state,
      tasks: {
        ...state.tasks,
        [id]: {
          ...state.tasks[id],
          content: newContent,
        },
      },
    }));
  }

  editImage(id, event) {
    const file = event.target.files[0];
    if (file.size > 500000) {
      alert(
        "File size is too big! Please choose a photo that is less than 500KB"
      );
      this.setState({ newTaskImage: "" });
    } else {
      this.getBase64(file).then((base64) => {
        this.setState(
          (state) => ({
            ...state,
            tasks: {
              ...state.tasks,
              [id]: {
                ...state.tasks[id],
                image: base64,
              },
            },
          }),
          () => localStorage.setItem("state", JSON.stringify(this.state))
        );
      });
    }
  }

  editColumn(id, columnName) {
    this.setState(
      (state) => ({
        ...state,
        columns: {
          ...state.columns,
          [id]: {
            ...state.columns[id],
            // id: columnName,
            title: columnName,
          },
        },
      }),
      () => localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  editProject(projectName) {
    this.setState(
      (state) => ({
        ...state,
        project: projectName,
      }),
      () => localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  newProject(event) {
    const name = this.state.newProjectValue;

    event.preventDefault();
    this.setState(
      (state) => ({
        ...state,
        project: name,
        welcomePage: false,
      }),
      () => localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  deleteTask(id, column) {
    let currentTasks = Object.assign({}, this.state.tasks);
    delete currentTasks[id];

    const columnTasks = Array.from(this.state.columns[column].taskIds);
    const indexToDelete = columnTasks.indexOf(id);
    columnTasks.splice(indexToDelete, 1);

    const updatedState = {
      ...this.state,
      tasks: currentTasks,
      columns: {
        ...this.state.columns,
        [column]: {
          ...this.state.columns[column],
          taskIds: columnTasks,
        },
      },
    };

    this.setState(updatedState, () =>
      localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  toggleFormVisibility() {
    if (this.state.formVisibility === "hidden") {
      this.setState({ formVisibility: "visible" });
    } else {
      this.setState({ formVisibility: "hidden" });
    }
  }

  closeBadgeModal() {
    this.setState(
      (state) => ({
        ...state,
        badgeModal: false,
      }),
      () => localStorage.setItem("state", JSON.stringify(this.state))
    );
  }

  toggleTutorial() {
    if (this.state.tutorialDisplay === "block") {
      this.setState({ tutorialDisplay: "none" }, () =>
        localStorage.setItem("state", JSON.stringify(this.state))
      );
    } else {
      this.setState({ tutorialDisplay: "block" });
    }
  }

  render() {
    const { formVisibility } = this.state;
    let addButton = <AddIcon />;
    if (formVisibility === "visible") {
      addButton = <CloseIcon />;
    }
    const messageVisible = formVisibility === "visible" ? "" : "Add a column";
    if (this.state.welcomePage) {
      return (
        <div className="app-splash">
          <div className="welcome-content">
            <h1>Welcome to BadASS Kanban!</h1>
            <h3>Choose a project name to get started</h3>
            <form onSubmit={this.newProject} noValidate autoComplete="off">
              <div className="welcome-input">
                <TextField
                  id="outlined-basic"
                  label="Insert Title"
                  variant="outlined"
                  value={this.state.newProjectValue}
                  onChange={(event) =>
                    this.setState({ newProjectValue: event.target.value })
                  }
                />
              </div>
              <Button variant="contained" color="primary" type="submit">
                Get Started
              </Button>
            </form>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <TutorialModal
            display={this.state.tutorialDisplay}
            toggleTutorial={this.toggleTutorial}
          />
          <BadgeModal
            open={this.state.badgeModal}
            close={this.closeBadgeModal}
            level={this.state.level}
            image={this.state.levelImage}
          />
          <Header
            image={this.state.levelImage}
            project={this.state.project}
            editProject={this.editProject}
            completed={this.state.columns["column-3"]}
            tasks={this.state.tasks}
          />
          <DragDropContext onDragEnd={this.onDragEnd}>
            <Droppable
              droppableId="columns"
              direction="horizontal"
              type="column"
            >
              {(provided) => (
                <div
                  className="column-container"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {this.state.columnOrder.map((columnId, index) => {
                    const column = this.state.columns[columnId];
                    const tasks = column.taskIds.map(
                      (taskId) => this.state.tasks[taskId]
                    );

                    return (
                      <KanbanColumn
                        deleteTask={this.deleteTask}
                        deleteColumn={this.deleteColumn}
                        id={column.id}
                        editTask={this.editTask}
                        editColumn={this.editColumn}
                        editContent={this.editContent}
                        editImage={this.editImage}
                        key={columnId}
                        column={column}
                        tasks={tasks}
                        index={index}
                        toggleNewTask={this.toggleNewTask}
                        confetti={this.state.confetti}
                      />
                    );
                  })}
                  {provided.placeholder}
                  <div className="add-col">
                    <div className="add-column-btn">
                      <Fab onClick={this.toggleFormVisibility}>{addButton}</Fab>
                      <p>{messageVisible}</p>
                    </div>
                    <div style={{ visibility: formVisibility }}>
                      <form
                        className="add-column-form text-center"
                        onSubmit={this.addColumn}
                      >
                        <TextField
                          id="outlined-basic"
                          label="Insert Title"
                          variant="outlined"
                          defaultValue={this.state.newColumn}
                          onChange={this.handleChange}
                        />
                        <div className="add-column-btn-wrapper">
                          <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                          >
                            Enter
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <NewTaskModal
            addTask={this.addTask}
            newTaskName={this.state.newTaskName}
            taskNameChange={this.taskNameChange}
            newTaskDescription={this.state.newTaskDescription}
            taskDescriptionChange={this.taskDescriptionChange}
            newTaskImage={this.state.newTaskImage}
            taskImageChange={this.taskImageChange}
            toggleNewTask={this.toggleNewTask}
            visibility={this.state.newTaskVisibility}
          />
        </div>
      );
    }
  }
}

export default App;
