package com.x.program.center.jaxrs.dict;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.exception.ExceptionAccessDenied;
import com.x.base.core.project.exception.ExceptionEntityNotExist;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WoId;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.general.core.entity.ApplicationDict;
import com.x.program.center.Business;
import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.StringUtils;

class ActionDeleteDataPath extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionDeleteDataPath.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, String dictFlag, String path) throws Exception {

		LOGGER.debug("execute:{}, dictFlag:{}.", effectivePerson::getDistinguishedName, () -> dictFlag);

		if(effectivePerson.isAnonymous()){
			throw new ExceptionAccessDenied(effectivePerson);
		}

		ActionResult<Wo> result = new ActionResult<>();

		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			String id = business.applicationDict().getWithUniqueName(dictFlag);
			if (StringUtils.isEmpty(id)) {
				throw new ExceptionEntityNotExist(dictFlag, ApplicationDict.class);
			}
			ApplicationDict dict = emc.find(id, ApplicationDict.class);
			String[] paths = path.split(PATH_SPLIT);
			delete(business, dict, paths);
			emc.commit();
			Wo wo = new Wo();
			wo.setId(dict.getId());
			result.setData(wo);
			return result;
		}
	}

	@Schema(name = "com.x.program.center.jaxrs.dict.ActionDeleteDataPath0$Wo")
	public static class Wo extends WoId {

		private static final long serialVersionUID = -5102612124840299831L;

	}

}
