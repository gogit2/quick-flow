package com.quickflow.task.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.quickflow.common.error.BusinessRuleException;
import com.quickflow.common.error.NotFoundException;
import com.quickflow.common.time.AppTime;
import com.quickflow.plan.domain.PlanSourceType;
import com.quickflow.plan.repo.PlanItemRepository;
import com.quickflow.task.domain.Task;
import com.quickflow.task.domain.TaskPriority;
import com.quickflow.task.domain.TaskRules;
import com.quickflow.task.domain.TaskStatus;
import com.quickflow.task.repo.TaskRepository;

@Service
@Transactional
public class TaskService {

    /** Search/filter input (D-13, D-14). Null fields are not filtered on; {@code archived} null = false. */
    public record TaskQuery(String q, TaskStatus status, TaskPriority priority, LocalDate dueDate,
            LocalDate dueFrom, LocalDate dueTo, Boolean archived, String sort, String dir) {
    }

    /** Fields of a create/update. On update a null status or priority keeps the current value. */
    public record TaskInput(String title, String description, TaskStatus status, TaskPriority priority,
            LocalDate dueDate) {
    }

    private final TaskRepository tasks;
    private final PlanItemRepository planItems;
    private final AppTime time;

    public TaskService(TaskRepository tasks, PlanItemRepository planItems, AppTime time) {
        this.tasks = tasks;
        this.planItems = planItems;
        this.time = time;
    }

    @Transactional(readOnly = true)
    public List<Task> search(TaskQuery query) {
        Comparator<Task> order = comparator(query.sort(), query.dir());
        if (query.dueFrom() != null && query.dueTo() != null && query.dueFrom().isAfter(query.dueTo())) {
            throw new BusinessRuleException("dueFrom", "dueFrom must not be after dueTo");
        }
        List<Task> found = new ArrayList<>(tasks.findAll(spec(query)));
        found.sort(order);
        return found;
    }

    @Transactional(readOnly = true)
    public Task get(Long id) {
        return find(id);
    }

    public Task create(TaskInput in) {
        TaskPriority priority = in.priority() == null ? TaskPriority.MEDIUM : in.priority();
        Task task = new Task(in.title().trim(), in.description(), priority, in.dueDate(), time.now());
        TaskRules.applyStatus(task, in.status() == null ? TaskStatus.TODO : in.status(), time.now());
        return tasks.save(task);
    }

    public Task update(Long id, TaskInput in) {
        Task task = find(id);
        task.setTitle(in.title().trim());
        task.setDescription(in.description());
        task.setDueDate(in.dueDate());
        if (in.priority() != null) {
            task.setPriority(in.priority());
        }
        if (in.status() != null) {
            TaskRules.applyStatus(task, in.status(), time.now());
        }
        return touch(task);
    }

    public void delete(Long id) {
        Task task = find(id);
        planItems.deleteBySource(PlanSourceType.TASK, task.getId()); // D-48
        tasks.delete(task);
    }

    /** US-TASK-03. Also used by plan items (D-47); idempotent. */
    public Task complete(Long id) {
        Task task = find(id);
        TaskRules.applyStatus(task, TaskStatus.DONE, time.now());
        return touch(task);
    }

    public Task setArchived(Long id, boolean archived) {
        Task task = find(id);
        task.setArchived(archived);
        return touch(task);
    }

    public LocalDate today() {
        return time.today();
    }

    private Task touch(Task task) {
        task.setUpdatedAt(time.now());
        return tasks.saveAndFlush(task);
    }

    private Task find(Long id) {
        return tasks.findById(id).orElseThrow(() -> NotFoundException.of("Task", id));
    }

    private static Specification<Task> spec(TaskQuery query) {
        return (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("archived"), Boolean.TRUE.equals(query.archived())));
            if (query.q() != null && !query.q().isBlank()) {
                String like = "%" + escape(query.q().trim().toLowerCase(Locale.ROOT)) + "%";
                p.add(cb.like(cb.lower(root.get("title")), like, '\\'));
            }
            if (query.status() != null) {
                p.add(cb.equal(root.get("status"), query.status()));
            }
            if (query.priority() != null) {
                p.add(cb.equal(root.get("priority"), query.priority()));
            }
            if (query.dueDate() != null) {
                p.add(cb.equal(root.get("dueDate"), query.dueDate()));
            }
            if (query.dueFrom() != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("dueDate"), query.dueFrom()));
            }
            if (query.dueTo() != null) {
                p.add(cb.lessThanOrEqualTo(root.get("dueDate"), query.dueTo()));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    /**
     * D-14: sort by dueDate (nulls last, whatever the direction) or createdAt; ties broken by id.
     * Defaults (A-06): sort createdAt; dir desc for createdAt, asc for dueDate.
     */
    private static Comparator<Task> comparator(String sort, String dir) {
        boolean desc;
        if (dir == null) {
            desc = !"dueDate".equals(sort);
        } else if (dir.equalsIgnoreCase("asc")) {
            desc = false;
        } else if (dir.equalsIgnoreCase("desc")) {
            desc = true;
        } else {
            throw new BusinessRuleException("dir", "dir must be asc or desc");
        }
        Comparator<Task> byId = Comparator.comparing(Task::getId);
        if (sort == null || sort.equals("createdAt")) {
            Comparator<Task> c = Comparator.comparing(Task::getCreatedAt).thenComparing(byId);
            return desc ? c.reversed() : c;
        }
        if (sort.equals("dueDate")) {
            Comparator<LocalDate> dates = desc ? Comparator.<LocalDate>reverseOrder() : Comparator.<LocalDate>naturalOrder();
            return Comparator.comparing(Task::getDueDate, Comparator.nullsLast(dates)).thenComparing(byId);
        }
        throw new BusinessRuleException("sort", "sort must be dueDate or createdAt");
    }
}
