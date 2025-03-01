package com.x.organization.assemble.control.jaxrs.person;

import java.util.List;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.entity.annotation.CheckRemoveType;
import com.x.base.core.project.cache.CacheManager;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.exception.ExceptionAccessDenied;
import com.x.base.core.project.exception.ExceptionEntityNotExist;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WoId;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.organization.assemble.control.Business;
import com.x.organization.core.entity.Custom;
import com.x.organization.core.entity.Group;
import com.x.organization.core.entity.Identity;
import com.x.organization.core.entity.Person;
import com.x.organization.core.entity.PersonAttribute;
import com.x.organization.core.entity.PersonExtend;
import com.x.organization.core.entity.Role;
import com.x.organization.core.entity.Unit;
import com.x.organization.core.entity.UnitDuty;

class ActionDelete extends BaseAction {
	private static final Logger LOGGER = LoggerFactory.getLogger(ActionDelete.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, String flag) throws Exception {

		LOGGER.debug("execute:{}.", effectivePerson::getDistinguishedName);

		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			ActionResult<Wo> result = new ActionResult<>();
			if (Config.token().isInitialManager(flag)) {
				throw new ExceptionDenyDeleteInitialManager();
			} else {
				Business business = new Business(emc);
				Person person = business.person().pick(flag);
				if (null == person) {
					throw new ExceptionEntityNotExist(flag, Person.class);
				}
				// 从内存中取到人
				person = emc.find(person.getId(), Person.class);
				if (!this.editable(business, effectivePerson, person)) {
					throw new ExceptionAccessDenied(effectivePerson);
				}
				List<Identity> identities = this.listIdentity(business, person);
				// 删除身份组织职务成员,提交后才可以删除身份
				emc.beginTransaction(UnitDuty.class);
				this.removeMemberOfUnitDuty(business, identities);
				emc.commit();
				// 删除身份
				emc.beginTransaction(Identity.class);
				for (Identity o : identities) {
					emc.remove(o, CheckRemoveType.all);
				}
				emc.commit();
				// 删除个人属性
				emc.beginTransaction(PersonAttribute.class);
				this.removePersonAttribute(business, person);
				// 删除个人扩展
				emc.beginTransaction(PersonExtend.class);
				this.removePersonExtend(business, person);
				// 删除个人自定义信息
				emc.beginTransaction(Custom.class);
				this.removePersonCustom(business, person);
				// 删除群组成员
				emc.beginTransaction(Group.class);
				this.removeMemberOfGroup(business, person);
				// 删除角色成员
				emc.beginTransaction(Role.class);
				this.removeMemberOfRole(business, person);
				// 删除组织的管理个人以及继承的管理个人
				emc.beginTransaction(Unit.class);
				this.removeMemberOfUnitController(business, person);
				// 删除个人管理者成员
				this.removeMemberOfPersonController(business, person);
				// 删除汇报人员为将要删除的人
				this.removeMemberOfPersonSuperior(business, person);
				emc.beginTransaction(Person.class);
				// 先进行一次提交,通过check
				emc.commit();
				emc.beginTransaction(Person.class);
				emc.remove(person, CheckRemoveType.all);
				emc.commit();
				CacheManager.notify(Person.class);
				CacheManager.notify(Identity.class);
				CacheManager.notify(Unit.class);
				CacheManager.notify(UnitDuty.class);
				CacheManager.notify(PersonAttribute.class);
				CacheManager.notify(Custom.class);
				CacheManager.notify(Group.class);
				CacheManager.notify(Role.class);
				// 通知x_collect_service_transmit同步数据到collect
				business.instrument().collect().person();
				Wo wo = new Wo();
				wo.setId(person.getId());
				result.setData(wo);
			}
			return result;
		}
	}

	public static class Wo extends WoId {

	}

//    private void removeMemberOfUnitController(Business business, Person person) throws Exception {
//        EntityManager em = business.entityManagerContainer().get(Unit.class);
//        CriteriaBuilder cb = em.getCriteriaBuilder();
//        CriteriaQuery<Unit> cq = cb.createQuery(Unit.class);
//        Root<Unit> root = cq.from(Unit.class);
//        Predicate p = cb.isMember(person.getId(), root.get(Unit_.controllerList));
//        List<Unit> os = em.createQuery(cq.select(root).where(p)).getResultList().stream().distinct()
//                .collect(Collectors.toList());
//        for (Unit o : os) {
//            o.getControllerList().remove(person.getId());
//        }
//    }

//    private void removeMemberOfPersonSuperior(Business business, Person person) throws Exception {
//        EntityManager em = business.entityManagerContainer().get(Person.class);
//        CriteriaBuilder cb = em.getCriteriaBuilder();
//        CriteriaQuery<Person> cq = cb.createQuery(Person.class);
//        Root<Person> root = cq.from(Person.class);
//        Predicate p = cb.equal(root.get(Person_.superior), person.getId());
//        List<Person> os = em.createQuery(cq.select(root).where(p)).getResultList();
//        for (Person o : os) {
//            o.setSuperior("");
//        }
//    }

//    private void removePersonAttribute(Business business, Person person) throws Exception {
//        EntityManager em = business.entityManagerContainer().get(PersonAttribute.class);
//        CriteriaBuilder cb = em.getCriteriaBuilder();
//        CriteriaQuery<PersonAttribute> cq = cb.createQuery(PersonAttribute.class);
//        Root<PersonAttribute> root = cq.from(PersonAttribute.class);
//        Predicate p = cb.equal(root.get(PersonAttribute_.person), person.getId());
//        List<PersonAttribute> os = em.createQuery(cq.select(root).where(p)).getResultList();
//        for (PersonAttribute o : os) {
//            business.entityManagerContainer().remove(o, CheckRemoveType.all);
//        }
//    }

//    private void removePersonCustom(Business business, Person person) throws Exception {
//        EntityManager em = business.entityManagerContainer().get(Custom.class);
//        CriteriaBuilder cb = em.getCriteriaBuilder();
//        CriteriaQuery<Custom> cq = cb.createQuery(Custom.class);
//        Root<Custom> root = cq.from(Custom.class);
//        Predicate p = cb.equal(root.get(Custom_.person), person.getId());
//        p = cb.or(p, cb.equal(root.get(Custom_.person), person.getDistinguishedName()));
//        List<Custom> os = em.createQuery(cq.select(root).where(p)).getResultList();
//        for (Custom o : os) {
//            business.entityManagerContainer().remove(o, CheckRemoveType.all);
//        }
//    }

//    private void removeMemberOfGroup(Business business, Person person) throws Exception {
//        EntityManager em = business.entityManagerContainer().get(Group.class);
//        CriteriaBuilder cb = em.getCriteriaBuilder();
//        CriteriaQuery<Group> cq = cb.createQuery(Group.class);
//        Root<Group> root = cq.from(Group.class);
//        Predicate p = cb.isMember(person.getId(), root.get(Group_.personList));
//        List<Group> os = em.createQuery(cq.select(root).where(p)).getResultList();
//        for (Group o : os) {
//            o.getPersonList().remove(person.getId());
//        }
//    }

//    private void removeMemberOfRole(Business business, Person person) throws Exception {
//        EntityManager em = business.entityManagerContainer().get(Role.class);
//        CriteriaBuilder cb = em.getCriteriaBuilder();
//        CriteriaQuery<Role> cq = cb.createQuery(Role.class);
//        Root<Role> root = cq.from(Role.class);
//        Predicate p = cb.isMember(person.getId(), root.get(Role_.personList));
//        List<Role> os = em.createQuery(cq.select(root).where(p)).getResultList();
//        for (Role o : os) {
//            o.getPersonList().remove(person.getId());
//        }
//    }
}
