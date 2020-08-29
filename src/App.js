import React from "react";
import "./App.css";
import Header from "./Components/Header";
import initialData from "./data/dummy-data";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import KanbanColumn from "./Components/KanbanColumn";
import { makeStyles } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import TextField from "@material-ui/core/TextField";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";

const useStyles = makeStyles((theme) => ({
  paper: {
    position: "absolute",
    width: 400,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    borderRadius: 8,
    padding: 32,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  root: {
    width: "100%",
    paddingBottom: 16,
  },
}));

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...initialData,
      newColumn: "",
      formVisibility: "hidden",
      newTaskVisibility: "none",
    };
    this.addColumn = this.addColumn.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleFormVisibility = this.toggleFormVisibility.bind(this);
    this.addTask = this.addTask.bind(this);
    this.newTaskModal = this.newTaskModal.bind(this);
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
      };
      this.setState(newState);
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
      };

      this.setState(newState);
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
    };
    this.setState(newState);
  };

  handleChange(event) {
    const value = event.target.value;
    this.setState({ newColumn: value });
  }

  addColumn(event) {
    event.preventDefault();
    const { columnOrder, newColumn } = this.state;

    //Addint to columnOrder
    let newColumnOrder = columnOrder.slice();
    newColumnOrder.push(newColumn);

    //Adding to columns

    this.setState((state) => ({
      ...state,
      columns: {
        ...state.columns,
        [newColumn]: {
          id: newColumn,
          title: newColumn,
          taskIds: [],
        },
      },
      columnOrder: newColumnOrder,
    }));
  }

  addTask(event) {
    console.log(event.target.id);
  }

  toggleFormVisibility() {
    if (this.state.formVisibility === "hidden") {
      this.setState({ formVisibility: "visible" });
    } else {
      this.setState({ formVisibility: "hidden" });
    }
  }

  newTaskModal() {
    const classes = useStyles();
    return (
      <div className={(classes.paper, this.state.newTaskVisibility)}>
        <form className={classes.root} noValidate autoComplete="off">
          <div>
            <TextField
              className={classes.root}
              id="outlined-basic"
              label="Insert Title"
              variant="outlined"
            />
          </div>
          <div></div>
          <TextField
            className={classes.root}
            id="outlined-multiline-static"
            label="Multiline"
            multiline
            rows={4}
            variant="outlined"
          />
        </form>
        <DeleteOutlineIcon />
      </div>
    );
  }
  render() {
    const { formVisibility } = this.state;
    let addButton = "+";
    if (formVisibility === "visible") {
      addButton = "x";
    }

    return (
      <div>
        <Header />
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="columns" direction="horizontal" type="column">
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
                      id={column.id}
                      key={column.id}
                      column={column}
                      tasks={tasks}
                      index={index}
                      addTask={this.addTask}
                    />
                  );
                })}
                {provided.placeholder}
                <div className="add-col">
                  <button
                    onClick={this.toggleFormVisibility}
                    className="add-column-btn"
                  >
                    {addButton}
                  </button>
                  <div style={{ visibility: formVisibility }}>
                    <form
                      className="add-column-form text-center"
                      onSubmit={this.addColumn}
                    >
                      <label htmlFor="column-name">Column Name</label> <br />
                      <input
                        name="column-name"
                        type="text"
                        id="column-name"
                        value={this.state.newColumn}
                        onChange={this.handleChange}
                      ></input>
                      <button type="submit">Enter</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <this.newTaskModal />
      </div>
    );
  }
}

export default App;
