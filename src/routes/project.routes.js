import { Router } from "express";
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMembersToProject,
    getProjectMembers,
    updateMemberRole,
    deleteMember,
} from "../controllers/project.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import {
    createProjectValidator,
    addMemberToProjectValidator,
} from "../validators/index.js";
import {
    verifyJWT,
    validateProjectPermissions,
} from "../middlewares/auth.middlewares.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT); // This means all the routers below this line will by default run verifyJWT as the 1st middleware

router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validate, createProject);

router
    .route("/:projectId")
    .get(validateProjectPermissions(AvailableUserRole), getProjectById)
    .put(
        validateProjectPermissions([UserRolesEnum["ADMIN"]]),
        createProjectValidator(),
        validate,
        updateProject,
    )
    .delete(
        validateProjectPermissions([UserRolesEnum["ADMIN"]]),
        deleteProject,
    );

router
    .route("/:projectId/members")
    .get(getProjectMembers)
    .post(
        validateProjectPermissions([UserRolesEnum["ADMIN"]]),
        addMemberToProjectValidator(),
        validate,
        addMembersToProject,
    );

router
    .route("/:projectId/members/:userId")
    .put(validateProjectPermissions([UserRolesEnum["ADMIN"]]), updateMemberRole)
    .delete(validateProjectPermissions([UserRolesEnum["ADMIN"]]), deleteMember);
export default router;
