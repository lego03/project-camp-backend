import { Task } from "../models/task.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";

const getProjectAnalytics = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const projectObjectId = new mongoose.Types.ObjectId(projectId);

  // Pie chart data: how many tasks are in each status
  const statusBreakdown = await Task.aggregate([
    { $match: { project: projectObjectId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  // Result shape: [{ _id: "todo", count: 5 }, { _id: "done", count: 3 }, ...]

  // Bar chart data: how many tasks each person is assigned
  const workloadBreakdown = await Task.aggregate([
    { $match: { project: projectObjectId, assignedTo: { $ne: null } } },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignee",
      },
    },
    { $unwind: "$assignee" },
    { $group: { _id: "$assignee.username", count: { $sum: 1 } } },
  ]);
  // Result shape: [{ _id: "guru", count: 4 }, { _id: "alice", count: 2 }, ...]

  const totalTasks = await Task.countDocuments({ project: projectObjectId });
  const doneTasks = await Task.countDocuments({ project: projectObjectId, status: "done" });
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalTasks,
        completionRate,
        statusBreakdown,
        workloadBreakdown,
      },
      "Analytics retrieved successfully",
    ),
  );
});

export { getProjectAnalytics };