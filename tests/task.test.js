const request = require("supertest")
const app = require("../src/app")
const Task = require("../src/models/task")
const { userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
} = require("./fixtures/db")

beforeEach(setupDatabase)

test("Should create task for user", async () => {
    const response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: "From my test"
        })
        .expect(201)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test("Should upload an image to an existing task", async() => {
    await request(app)
        .post(`/tasks/${taskOne._id}/task-image`)
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .attach("task-image", "tests/fixtures/profile-pic.jpeg")
        .expect(200)

    // must fetch taskOne from db to check that image has been saved to task
    const taskOneAfterOperation = await Task.findById(taskOne._id)
    expect(taskOneAfterOperation.image).not.toEqual(undefined)
    expect(taskOneAfterOperation.image).toEqual(expect.any(Buffer))
})

test("Should not upload an image to a task for an unauthenticated user", async () => {
    await request(app)
        .post(`/tasks/${taskOne._id}/task-image`)
        .attach("task-image", "tests/fixtures/profile-pic.jpeg")
        .expect(401)

    const taskOneAfterOperation = await Task.findById(taskOne._id)
    expect(taskOneAfterOperation.image).toEqual(undefined)
})

test("Should not upload an image to a task that was not created by a user", async () => {
    await request(app)
        .post(`/tasks/${taskOne._id}/task-image`)
        .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
        .attach("task-image", "tests/fixtures/profile-pic.jpeg")
        .expect(404)

    const taskOneAfterOperation = await Task.findById(taskOne._id)
    expect(taskOneAfterOperation.image).toEqual(undefined)
})

test("Should return the tasks created by a user", async () => {
    const response = await request(app)
        .get("/tasks")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    expect(response.body.length).toEqual(2)
})

test("Should not delete a task that the user didn't create", async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)
    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})